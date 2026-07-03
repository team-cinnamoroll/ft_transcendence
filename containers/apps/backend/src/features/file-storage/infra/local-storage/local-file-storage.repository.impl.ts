import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import {
  FileStoragesServiceRepositorySpec,
  UploadOptions,
} from '../../domain/repositories/storage-service.repository';
import { StorageDataInput } from '../../domain/usecases/file-storage.file-save.request';
import { type BucketNameType, type StorageKey } from '../../domain/file-metadata.entity';
import { type Visibility, type FilePath, type FileMetadataId } from '@tracen/contracts';

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

class LocalFileStorageRepository implements FileStoragesServiceRepositorySpec {
  // DockerのVolumeがマウントされる絶対パス
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * ファイルをローカルディスクに保存する
   * BufferとReadableStreamの両方に対応し、パケット（チャンク）単位でディスクに書き込む
   */
  async save(options: UploadOptions, data: StorageDataInput): Promise<void> {
    // 例: /app/uploads/public-bucket/avatars/user-123.png
    const fullPath = path.join(this.baseDir, options.bucket, options.storageKey);

    // 保存先ディレクトリ（階層）がなければ再帰的に作成する
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    if (data instanceof Buffer) {
      // 1. Buffer（メモリ一括）の場合の書き込み
      await fs.writeFile(fullPath, data);
    } else {
      // 2. ReadableStream（パケット・チャンク単位）の場合のストリーミング書き込み
      // Web標準の ReadableStream を Node.js の生ストリームに変換
      const nodeReadable = Readable.fromWeb(data as Parameters<typeof Readable.fromWeb>[0]);

      // 書き込み用のストリームを作成
      const writeStream = (await fs.open(fullPath, 'w')).createWriteStream();

      // パイプで繋いでデータを流し込み、完了を待つ（サーバーのメモリを消費しない）
      nodeReadable.pipe(writeStream);
      await finished(writeStream);
    }
  }

  /**
   * ファイルをローカルディスクからストリームとして読み出す
   * Honoの c.body(stream) にそのまま流せるように Web標準の ReadableStream で返す
   */
  async get(
    bucket: BucketNameType,
    storageKey: StorageKey
  ): Promise<ReadableStream<Uint8Array> | null> {
    const fullPath = path.join(this.baseDir, bucket, storageKey);

    try {
      // ファイルが存在するか確認（存在しなければ例外が飛ぶ）
      await fs.access(fullPath);

      // Node.jsのファイルオープン
      const fileHandle = await fs.open(fullPath, 'r');
      // Node.jsの読み込みストリームを作成
      const nodeStream = fileHandle.createReadStream();

      // HonoやWeb標準で扱えるように ReadableStream<Uint8Array> に変換して返す
      return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error(`Error reading file ${fullPath}:`, error);
      // ファイルが存在しない、または読み込めない場合は不整合を防ぐため null を返す
      return null;
    }
  }

  /**
   * ファイルをローカルディスクから削除する
   */
  async delete(bucket: BucketNameType, storageKey: StorageKey): Promise<void> {
    const fullPath = path.join(this.baseDir, bucket, storageKey);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // ファイルが既に存在しない場合の例外（ENOENT）は正常終了とみなす
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return; // 正常終了
      }

      console.error(`Error deleting file ${fullPath}:`, error);
      throw error;
    }
  }

  /**
   * ファイルにアクセスするためのURLを解決する
   */
  async resolveUrl(
    bucket: BucketNameType,
    storageKey: StorageKey,
    fileId: FileMetadataId,
    visibility: Visibility
  ): Promise<FilePath> {
    if (visibility === 'public') {
      // 【パブリックアクセス】
      // Honoの静的ファイルサーブ（hono/serve-static）のエンドポイントURLを返す
      // 例: /static/public-bucket/avatars/user-123.png
      return `/static/${bucket}/${storageKey}`;
    } else {
      // 【プライベートアクセス（認証必須）】
      // 直接ファイルを返さず、必ずHonoの認可ミドルウェアを通るAPIのパスを返す
      // 例: /api/v1/file-storage/download/file-123
      return `/api/v1/file-storage/download/${fileId}`;
    }
  }
}

export function createLocalStorageRepository(baseDir: string): FileStoragesServiceRepositorySpec {
  return new LocalFileStorageRepository(baseDir);
}

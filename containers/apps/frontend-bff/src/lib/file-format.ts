/**
 * ファイル形式ごとの先頭バイトのシグネチャ(マジックナンバー)。
 * ブラウザが申告する file.type（拡張子などから推測された自己申告値）は信用せず、
 * 実際のバイト列から形式を判定するために使う。
 */
type SniffableFormat = 'jpeg' | 'png' | 'pdf';

const FORMAT_SIGNATURES: Record<SniffableFormat, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  pdf: [0x25, 0x50, 0x44, 0x46], // "%PDF"
};

const MIME_TYPE_TO_FORMAT: Record<string, SniffableFormat> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

const HEADER_READ_SIZE = Math.max(
  ...Object.values(FORMAT_SIGNATURES).map((signature) => signature.length)
);

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

/** ファイル先頭バイトを読み取り、実際のファイル形式を判定する（file.typeは見ない） */
export async function sniffFileFormat(file: File): Promise<SniffableFormat | null> {
  const buffer = await file.slice(0, HEADER_READ_SIZE).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [format, signature] of Object.entries(FORMAT_SIGNATURES) as [
    SniffableFormat,
    number[],
  ][]) {
    if (matchesSignature(bytes, signature)) return format;
  }
  return null;
}

/**
 * 申告されたMIMEタイプの許可リスト(allowedTypes)と、ファイル実体のシグネチャが一致するかを検証する。
 * file.typeや拡張子が偽装されていても、実体のバイト列と食い違っていれば弾ける。
 */
export async function isAllowedFileFormat(file: File, allowedTypes: string[]): Promise<boolean> {
  const detected = await sniffFileFormat(file);
  if (!detected) return false;
  return allowedTypes.some((type) => MIME_TYPE_TO_FORMAT[type] === detected);
}

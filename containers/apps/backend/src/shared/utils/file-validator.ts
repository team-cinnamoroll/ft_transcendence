import { ValidationError } from '../errors/global.error';
import type { MimeType } from '@tracen/contracts';

const MAGIC_NUMBERS = {
  JPG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  PDF: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
};

function checkMagicNumber(chunk: Uint8Array, mimeType: MimeType): boolean {
  // 一般的なチャンクサイズを考慮し、最低限必要なバイト数があるか確認
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/pjpeg') {
    if (chunk.length < 3) return false;
    return (
      chunk[0] === MAGIC_NUMBERS.JPG[0] &&
      chunk[1] === MAGIC_NUMBERS.JPG[1] &&
      chunk[2] === MAGIC_NUMBERS.JPG[2]
    );
  }

  if (mimeType === 'image/png' || mimeType === 'image/x-png') {
    if (chunk.length < 8) return false;
    return MAGIC_NUMBERS.PNG.every((byte, i) => chunk[i] === byte);
  }

  if (mimeType === 'application/pdf') {
    if (chunk.length < 5) return false;
    return MAGIC_NUMBERS.PDF.every((byte, i) => chunk[i] === byte);
  }

  return false;
}

export function createFileSignatureValidatorStream(expectedMimeType: MimeType) {
  let isFirstChunk = true;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (isFirstChunk) {
        const isValid = checkMagicNumber(chunk, expectedMimeType);
        if (!isValid) {
          // 不正な場合はストリームをエラーで中断し、ValidationError を発生させる
          controller.error(
            new ValidationError(
              'Invalid file format signature. The actual file content does not match the provided MIME type.'
            )
          );
          return;
        }
        isFirstChunk = false;
      }
      // 検証に成功した場合、そのままチャンクをエンキューして後続に流す
      controller.enqueue(chunk);
    },
  });
}

export class StorageQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

export class InternalStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalStorageError';
  }
}

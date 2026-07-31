// 400 Bad Request Error
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 401 Unauthorized Error
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// 403 Forbidden Error
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// 404 Not Found Error
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// 409 Conflict Error
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// 500 Internal Server Error
export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}

export class InternalValidationError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'InternalValidationError';
    if (cause) {
      this.cause = cause;
    }
  }
}

// 503 Service Unavailable Error
export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export class ServiceConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceConnectionError';
  }
}

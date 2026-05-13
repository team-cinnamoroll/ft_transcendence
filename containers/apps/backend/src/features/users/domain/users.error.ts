export class EmailAlreadyExistsError extends Error {
  override name = 'EmailAlreadyExistsError';

  constructor() {
    super('email already exists');
  }
}
export class UserAlreadyExistsError extends Error {
  override name = 'UserAlreadyExistsError';

  constructor() {
    super('user already exists');
  }
}

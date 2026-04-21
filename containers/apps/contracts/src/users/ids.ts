import { uuidSchema, type Uuid } from '../shared/primitives/uuid';

export const userIdSchema = uuidSchema;
export type UserId = Uuid;

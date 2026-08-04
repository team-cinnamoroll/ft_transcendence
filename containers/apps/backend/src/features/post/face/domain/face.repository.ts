import type { FaceId, UserId } from '@tracen/contracts';
import { FaceEntity } from './face.entity';

export type FaceRepositorySpec = {
  getFaceById: (faceId: FaceId) => Promise<FaceEntity | null>;
  getFacesByIds: (faceIds: FaceId[]) => Promise<FaceEntity[]>;
  getFacesByUserId: (userId: UserId) => Promise<FaceEntity[]>;

  createFace: (face: FaceEntity) => Promise<FaceEntity>;
  updateFace: (face: FaceEntity) => Promise<FaceEntity>;
  deleteFaceById: (faceId: FaceId) => Promise<void>;
};

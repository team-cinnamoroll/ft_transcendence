export type {
  UserProfile,
  UserProfileUpsertRequest,
  Relationship,
  RelationshipStatus,
  UserProfilesResponse,
  UserProfileWithRelationship,
} from '@tracen/contracts';
import type { UserProfile, Relationship } from '@tracen/contracts';

/** プロフィールに、閲覧者から見た関係(フレンド状態)を添えたもの */
export type ProfileWithRelationship = UserProfile & { relationship: Relationship | null };

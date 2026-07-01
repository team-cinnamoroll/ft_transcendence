import { type Notification } from '@/types/notification';
import { USER_IDS, FACE_IDS, SEED_IDS, NOTIF_IDS } from './ids';

export const notifications: Notification[] = [
  {
    id: NOTIF_IDS.n1,
    type: 'subscribe',
    fromUserId: USER_IDS.user4,
    faceId: FACE_IDS.face11,
    createdAt: '2026-03-30T09:12:00+09:00',
  },
  {
    id: NOTIF_IDS.n2,
    type: 'link',
    fromUserId: USER_IDS.user2,
    seedId: SEED_IDS.s1107,
    createdAt: '2026-03-28T18:45:00+09:00',
  },
  {
    id: NOTIF_IDS.n3,
    type: 'subscribe',
    fromUserId: USER_IDS.user3,
    faceId: FACE_IDS.face12,
    createdAt: '2026-03-25T14:00:00+09:00',
  },
  {
    id: NOTIF_IDS.n4,
    type: 'link',
    fromUserId: USER_IDS.user3,
    seedId: SEED_IDS.s1106,
    createdAt: '2026-03-20T21:30:00+09:00',
  },
  {
    id: NOTIF_IDS.n5,
    type: 'subscribe',
    fromUserId: USER_IDS.user2,
    faceId: FACE_IDS.face11,
    createdAt: '2026-03-15T10:22:00+09:00',
  },
  {
    id: NOTIF_IDS.n6,
    type: 'link',
    fromUserId: USER_IDS.user4,
    seedId: SEED_IDS.s1105,
    createdAt: '2026-03-10T08:05:00+09:00',
  },
];

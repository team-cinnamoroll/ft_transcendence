import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import {
  FriendshipCreateRequestSchema,
  FriendshipCreateResponseSchema,
  FriendshipAcceptRequestSchema,
  FriendshipAcceptResponseSchema,
  FriendshipRejectRequestSchema,
  FriendshipRejectResponseSchema,
  FriendshipListRequestSchema,
  FriendshipListResponseSchema,
  FriendshipPendingListRequestSchema,
  FriendshipPendingListResponseSchema,
  FriendshipEndRequestSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { injectFriendshipDeps, type FriendshipHandlerEnv } from './friendship.di';
import { injectPresenceDeps } from '../presence/presence.di';
import { injectFileQueryDeps } from '../file-storage/file.query-service.di';
import {
  createFriendship,
  acceptFriendship,
  rejectFriendship,
  getMyFriends,
  endFriendship,
  getMyPendingFriends,
} from './domain/usecases';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors/global.error';
import { makeSafeResponse } from '../../shared/utils/validation';

export function friendshipRouter() {
  return new Hono<FriendshipHandlerEnv>()
    .use('*', injectFriendshipDeps())
    .post('/requests', cZValidator('json', FriendshipCreateRequestSchema), async (c) => {
      // フレンド申請の送信
      const friendshipRepo = c.get('friendshipRepo');
      const requesterId = c.get('requesterId');
      const { addresseeId } = c.req.valid('json');
      try {
        const friendship = await createFriendship(friendshipRepo, requesterId, addresseeId);
        return c.json(
          makeSafeResponse(FriendshipCreateResponseSchema, {
            success: true,
            data: { friendship },
          }),
          201
        );
      } catch (err) {
        console.error('Error during friendship creation:', err);
        if (err instanceof ForbiddenError) {
          return c.json(
            makeSafeResponse(FriendshipCreateResponseSchema, {
              success: false,
              message: err.message,
            }),
            403
          );
        }
        if (err instanceof ConflictError) {
          return c.json(
            makeSafeResponse(FriendshipCreateResponseSchema, {
              success: false,
              message: err.message,
            }),
            409
          );
        }
        throw err; // グローバルエラーハンドラで処理
      }
    })
    .patch(
      '/requests/:requestId/accept',
      cZValidator('param', FriendshipAcceptRequestSchema),
      async (c) => {
        // フレンド申請の承認
        const requesterId = c.get('requesterId');
        const { requestId } = c.req.valid('param');
        const friendshipRepo = c.get('friendshipRepo');
        try {
          const acceptedFriendship = await acceptFriendship(friendshipRepo, requestId, requesterId);
          return c.json(
            makeSafeResponse(FriendshipAcceptResponseSchema, {
              success: true,
              data: { friendship: acceptedFriendship },
            }),
            200
          );
        } catch (err) {
          console.error('Error during friendship acceptance:', err);
          if (err instanceof UnauthorizedError) {
            return c.json(
              makeSafeResponse(FriendshipAcceptResponseSchema, {
                success: false,
                message: err.message,
              }),
              401
            );
          }
          if (err instanceof ForbiddenError) {
            return c.json(
              makeSafeResponse(FriendshipAcceptResponseSchema, {
                success: false,
                message: err.message,
              }),
              403
            );
          }
          if (err instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(FriendshipAcceptResponseSchema, {
                success: false,
                message: err.message,
              }),
              404
            );
          }
          if (err instanceof ConflictError) {
            return c.json(
              makeSafeResponse(FriendshipAcceptResponseSchema, {
                success: false,
                message: err.message,
              }),
              409
            );
          }

          throw err; // グローバルエラーハンドラで処理
        }
      }
    )
    .delete(
      '/requests/:requestId',
      cZValidator('param', FriendshipRejectRequestSchema),
      async (c) => {
        // フレンド申請の取り消し・拒否
        const requesterId = c.get('requesterId');
        const { requestId } = c.req.valid('param');
        const friendshipRepo = c.get('friendshipRepo');
        try {
          const rejectedFriendship = await rejectFriendship(friendshipRepo, requestId, requesterId);
          return c.json(
            makeSafeResponse(FriendshipRejectResponseSchema, {
              success: true,
              data: { friendship: rejectedFriendship },
            }),
            200
          );
        } catch (err) {
          console.error('Error during friendship rejection:', err);
          if (err instanceof ForbiddenError) {
            return c.json(
              makeSafeResponse(FriendshipRejectResponseSchema, {
                success: false,
                message: err.message,
              }),
              403
            );
          }
          if (err instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(FriendshipRejectResponseSchema, {
                success: false,
                message: err.message,
              }),
              404
            );
          }
          throw err; // グローバルエラーハンドラで処理
        }
      }
    )
    .delete('/:targetUserId', cZValidator('param', FriendshipEndRequestSchema), async (c) => {
      // フレンド関係の終了（削除）
      const requesterId = c.get('requesterId');
      const { targetUserId } = c.req.valid('param');
      const friendshipRepo = c.get('friendshipRepo');
      try {
        await endFriendship(friendshipRepo, requesterId, targetUserId);
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during ending friendship:', err);
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: err.message,
            }),
            404
          );
        }
        throw err; // グローバルエラーハンドラで処理
      }
    })
    .use('*', injectFileQueryDeps())
    .get('/requests', cZValidator('query', FriendshipPendingListRequestSchema), async (c) => {
      // フレンド申請一覧の取得（受信／送信）
      const requesterId = c.get('requesterId');
      const friendshipRepo = c.get('friendshipRepo');
      const fileQueryService = c.get('fileQueryService');
      const { type, limit, cursor } = c.req.valid('query');
      try {
        const [pendingRequests, nextCursor] = await getMyPendingFriends(
          friendshipRepo,
          fileQueryService,
          requesterId,
          {
            type,
            limit,
            cursor,
          }
        );
        return c.json(
          makeSafeResponse(FriendshipPendingListResponseSchema, {
            success: true,
            data: { pendingRequests, nextCursor },
          }),
          200
        );
      } catch (err) {
        console.error('Error during fetching pending friends list:', err);
        throw err; // グローバルエラーハンドラで処理
      }
    })
    .use('*', injectPresenceDeps())
    .get('/', cZValidator('query', FriendshipListRequestSchema), async (c) => {
      // 承認済みフレンド一覧の取得
      const requesterId = c.get('requesterId');
      const friendshipRepo = c.get('friendshipRepo');
      const presenceRepo = c.get('presenceRepo');
      const fileQueryService = c.get('fileQueryService');
      const { limit, cursor } = c.req.valid('query');
      try {
        const [friendProfiles, nextCursor] = await getMyFriends(
          friendshipRepo,
          presenceRepo,
          fileQueryService,
          requesterId,
          {
            limit,
            cursor,
          }
        );
        return c.json(
          makeSafeResponse(FriendshipListResponseSchema, {
            success: true,
            data: { friendships: friendProfiles, nextCursor },
          }),
          200
        );
      } catch (err) {
        console.error('Error during fetching friends list:', err);
        throw err; // グローバルエラーハンドラで処理
      }
    });
}

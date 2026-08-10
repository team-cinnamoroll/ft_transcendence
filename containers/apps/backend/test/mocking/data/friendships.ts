/**
 * フレンド関係の定義。userKeyはdata/users.tsのkeyと対応する。
 * フレンド機能の各状態(承認済み・送信中・受信中・無関係)を検証できるよう、
 * mainUserを中心にバリエーションを持たせている。
 */
export type MockFriendship = {
  /** 申請を送るユーザー */
  requesterKey: string;
  /** 申請を受けるユーザー */
  addresseeKey: string;
  /** trueなら addressee が承認するところまで行う。falseなら申請中のまま残す */
  accept: boolean;
};

export const friendships: MockFriendship[] = [
  // 承認済み(mainUserから見て「フレンド」表示になる)
  { requesterKey: 'mainUser', addresseeKey: 'friendAccepted1', accept: true },
  { requesterKey: 'mainUser', addresseeKey: 'friendAccepted2', accept: true },
  // 送信中(mainUserから見て「申請中」表示になる)
  { requesterKey: 'mainUser', addresseeKey: 'friendOutgoing', accept: false },
  // 受信中(mainUserから見て「承認待ち」表示になる)
  { requesterKey: 'friendIncoming', addresseeKey: 'mainUser', accept: false },
  // unrelatedUserとは何も関係を作らない
];

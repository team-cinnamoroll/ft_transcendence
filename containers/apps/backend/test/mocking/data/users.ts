export type MockUser = {
  /** スクリプト内でユーザーを参照するためのキー(実際のIDはサインアップ時にAPIが発行する) */
  key: string;
  name: string;
  avatarUrl?: string;
};

export const users: MockUser[] = [
  {
    key: 'mainUser',
    name: '開発 太郎',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-main-user',
  },
  {
    key: 'friendAccepted1',
    name: '佐藤 花子',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-friend-accepted-1',
  },
  {
    key: 'friendAccepted2',
    name: '鈴木 一郎',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-friend-accepted-2',
  },
  {
    key: 'friendOutgoing',
    name: '田中 美咲',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-friend-outgoing',
  },
  {
    key: 'friendIncoming',
    name: '高橋 健太',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-friend-incoming',
  },
  {
    key: 'unrelatedUser',
    name: '渡辺 さくら',
    avatarUrl: 'https://i.pravatar.cc/150?u=mock-unrelated-user',
  },
];

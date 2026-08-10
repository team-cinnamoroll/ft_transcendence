import { daysAgo, yearsAgo } from '../date-helpers';

export type MockSeedAttachment = { kind: 'photo'; url: string } | { kind: 'pdf' };

export type MockSeed = {
  faceKey: string;
  body: string;
  createdAt: string;
  attachments?: MockSeedAttachment[];
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

// ─── memoriesFace: 草機能・「1年前の今日」検証用(365日に分散した約150件) ───

const DEV_LOG_BODIES = [
  'PostgreSQLのインデックス周りを調べて、クエリが早くなった。',
  'ずっと詰まっていたバグの原因が、タイムゾーンの扱い間違いだったと判明した。',
  'ペアプロで新しい設計パターンを教えてもらった。今度自分でも試したい。',
  'テストコードを先に書くようにしたら、後の手戻りが減った気がする。',
  '深夜まで粘ったが解決せず。明日改めて頭を冷やして見直す。',
  '小さなリファクタリングを積み重ねる大切さを実感した一日。',
  'ドキュメントを読み込んだら、遠回りしていたことに気づいた。',
  'レビューで指摘をもらって、視野が広がった。',
  '新しいライブラリを試してみた。思ったより導入が楽だった。',
  '設計を見直して、依存関係がすっきりした。',
  '今日はあまり進まなかったけど、原因の切り分けはできた。',
  'CI がようやく安定した。長かった。',
  '朝からずっと調べ物をしていたら1日終わってしまった。',
  '小さい機能だけど、ユーザー目線で考え直すと実装がだいぶ変わった。',
  '久しぶりにアルゴリズムの本を開いた。基礎は大事。',
];

function buildMemoriesFaceSeeds(): MockSeed[] {
  const seeds: MockSeed[] = [];
  for (let i = 0; i < 149; i++) {
    seeds.push({
      faceKey: 'memoriesFace',
      body: pick(DEV_LOG_BODIES),
      createdAt: daysAgo(randomInt(0, 364)),
    });
  }
  // 「1年前の今日」機能の検証を確実にするための1件
  seeds.push({
    faceKey: 'memoriesFace',
    body: 'ちょうど1年前の今日、このアプリの開発を始めた。あの頃は右も左も分からなかったな。',
    createdAt: yearsAgo(1),
  });
  return seeds;
}

// ─── mainUserの残り24Face: ページング検証用(各3〜5件、直近4ヶ月に分散) ───

const THEME_BODIES: Record<string, string[]> = {
  mainExtra1: [
    'ベンチプレスの重量が少し伸びた。',
    '今日は脚の日。翌日の筋肉痛がひどい。',
    '久しぶりに自己ベストを更新できた。',
  ],
  mainExtra2: [
    '近くの低山に登ってきた。景色が最高だった。',
    '雨で途中撤退。装備を見直したい。',
    '紅葉のシーズンにまた来たい。',
  ],
  mainExtra3: [
    '新しいボードゲームを友人と遊んだ。ルールが独特で面白い。',
    'カタンで惨敗。次は戦略を練り直す。',
    '4人集まってワイワイ遊べて楽しかった。',
  ],
  mainExtra4: [
    '夕暮れ時の街並みを撮りに出かけた。',
    '新しいレンズを試してみた。ボケ味が綺麗。',
    '猫を発見して思わずシャッターを切った。',
  ],
  mainExtra5: [
    'トマトの苗を植えた。育つのが楽しみ。',
    'ベランダの花が咲いた。',
    '水やりを忘れて少ししおれてしまった。反省。',
  ],
  mainExtra6: [
    '棚を作った。歪みが気になるけど初めてにしては上出来。',
    'ペンキ塗りに挑戦。養生が大事だと学んだ。',
    '工具を新調した。',
  ],
  mainExtra7: [
    '過去問を解いた。合格ラインには届かず。',
    '苦手分野をまとめノートに整理した。',
    '模試の結果が少し上がってきた。',
  ],
  mainExtra8: [
    '5km走った。ペースは遅いが継続が大事。',
    '朝ランが気持ちよかった。',
    '久しぶりに走ったら息が上がった。',
  ],
  mainExtra9: [
    '朝ヨガを始めてみた。体が軽くなる気がする。',
    '柔軟性の無さを痛感した。',
    '呼吸を意識するだけで違うものだと知った。',
  ],
  mainExtra10: [
    '近場の温泉に日帰りで行ってきた。',
    '露天風呂からの景色が良かった。',
    '疲れが取れて最高だった。',
  ],
  mainExtra11: [
    '星がよく見える場所を見つけた。',
    '流星群を観測しに夜更かしした。',
    '望遠鏡を新調しようか検討中。',
  ],
  mainExtra12: [
    '久しぶりに刺繍をした。',
    '簡単なポーチを作ってみた。',
    '糸の選び方でだいぶ印象が変わる。',
  ],
  mainExtra13: [
    '新しいおもちゃを買ったら大喜びしていた。',
    '寝顔が可愛すぎる。',
    '今日は元気いっぱいに走り回っていた。',
  ],
  mainExtra14: [
    '初めて寄席に行ってきた。生の落語は迫力が違う。',
    '古典落語の奥深さを知った。',
    '思わず声を出して笑ってしまった。',
  ],
};

function buildMainExtraFaceSeeds(): MockSeed[] {
  const seeds: MockSeed[] = [];
  for (const [faceKey, bodies] of Object.entries(THEME_BODIES)) {
    const count = randomInt(3, 5);
    for (let i = 0; i < count; i++) {
      // 開発ログ以外のmainUserのFaceは、約3分の1のSeedに写真を添付する
      const hasPhoto = Math.random() < 1 / 3;
      seeds.push({
        faceKey,
        body: pick(bodies),
        createdAt: daysAgo(randomInt(0, 120)),
        attachments: hasPhoto
          ? [{ kind: 'photo', url: `https://picsum.photos/seed/mock-${faceKey}-${i}/600/400` }]
          : undefined,
      });
    }
  }
  return seeds;
}

// ─── 他5ユーザーのFace: 画像・PDF添付・長文を混在させた具体的なSeed ───

const otherUserSeeds: MockSeed[] = [
  // friendAccepted1
  {
    faceKey: 'friendAccepted1Books',
    body: '『三体』読了。宇宙の広大さにめまいがした。ハードSFはやっぱり面白い。続刊もすぐ読みたい。',
    createdAt: daysAgo(3),
  },
  {
    faceKey: 'friendAccepted1Books',
    body: '『1984年』を読み始めた。オーウェルが1940年代に書いたとは思えないほど現代社会と符合する部分が多くて、少し怖い。',
    createdAt: daysAgo(10),
  },
  {
    faceKey: 'friendAccepted1Books',
    body:
      '今月読んだ本を振り返ってみる。今月は思ったより多くの本を読めた気がする。' +
      '最初に読んだのは積読していたミステリで、伏線の張り方が見事で最後まで飽きずに読めた。' +
      '次に読んだのは友人に勧められたエッセイで、著者の視点の切り替え方が新鮮だった。' +
      '来月はもう少しジャンルを広げて、普段読まないノンフィクションにも挑戦してみたい。',
    createdAt: daysAgo(20),
  },
  {
    faceKey: 'friendAccepted1Cafe',
    body: '駅前に新しくできたカフェへ。豆から挽いてくれる丁寧さが好印象。',
    createdAt: daysAgo(7),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-cafe1/600/400' }],
  },
  {
    faceKey: 'friendAccepted1Cafe',
    body: '窓際の席が特等席のお店を発見。読書がはかどる。',
    createdAt: daysAgo(15),
  },

  // friendAccepted2
  {
    faceKey: 'friendAccepted2Game',
    body: '念願のRPGをついにクリア。エンディングで泣いた。',
    createdAt: daysAgo(2),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-game1/600/400' }],
  },
  {
    faceKey: 'friendAccepted2Game',
    body: 'アップデートで新しいダンジョンが追加されたので早速潜ってきた。',
    createdAt: daysAgo(8),
  },
  {
    faceKey: 'friendAccepted2Anime',
    body: '今期アニメの中で一番ハマっている作品の最終回を観た。伏線回収が見事だった。',
    createdAt: daysAgo(5),
  },
  {
    faceKey: 'friendAccepted2Anime',
    body: '昔観た作品を配信で見返している。当時気づかなかった演出に気づけて楽しい。',
    createdAt: daysAgo(14),
  },
  {
    faceKey: 'friendAccepted2Movie',
    body: '劇場で新作を観てきた。映像美がすごかった。',
    createdAt: daysAgo(4),
  },

  // friendOutgoing
  {
    faceKey: 'friendOutgoingCooking',
    body: '週末は作り置き。今週は常備菜を5品ほど仕込んだ。',
    createdAt: daysAgo(6),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-cooking1/600/400' }],
  },
  {
    faceKey: 'friendOutgoingCooking',
    body: '初めてパンを焼いてみた。膨らみはいまいちだったが味は悪くなかった。',
    createdAt: daysAgo(18),
  },
  {
    faceKey: 'friendOutgoingCooking',
    body:
      'レシピノートの整理を兼ねて、最近よく作る料理をまとめてみる。' +
      '平日は時短を優先して、作り置き可能な副菜を中心にローテーションしている。' +
      '休日は逆に時間をかけて、煮込み料理や発酵を伴うレシピに挑戦することが多い。' +
      '来月は季節の食材を使った献立をもっと増やしていきたい。',
    createdAt: daysAgo(25),
  },
  {
    faceKey: 'friendOutgoingTravel',
    body: '弾丸で温泉旅行へ。日常を忘れてのんびりできた。',
    createdAt: daysAgo(9),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-travel1/600/400' }],
  },
  {
    faceKey: 'friendOutgoingTravel',
    body: '旅の記録として旅程表をPDFでまとめてみた。',
    createdAt: daysAgo(30),
    attachments: [{ kind: 'pdf' }],
  },
  {
    faceKey: 'friendOutgoingCafe',
    body: '新作のケーキが美味しすぎて写真を撮る前に食べ始めてしまった。',
    createdAt: daysAgo(12),
  },

  // friendIncoming
  {
    faceKey: 'friendIncomingTech',
    body: '今日学んだこと: 非同期処理のエラーハンドリングパターンについて。',
    createdAt: daysAgo(1),
  },
  {
    faceKey: 'friendIncomingTech',
    body: '社内勉強会の資料をPDFでまとめて共有した。',
    createdAt: daysAgo(11),
    attachments: [{ kind: 'pdf' }],
  },
  {
    faceKey: 'friendIncomingTech',
    body:
      '最近読んだ技術書の感想をまとめておく。設計に関する章が特に参考になった。' +
      '具体例が豊富で、自分のプロジェクトに当てはめて考えやすかったのが良かった点。' +
      '一方で、後半の分散システムの章はやや難易度が高く、何度か読み返す必要があった。' +
      '次はチームメンバーにも共有して、輪読会をやってみたい。',
    createdAt: daysAgo(22),
  },
  {
    faceKey: 'friendIncomingWorkout',
    body: 'デッドリフトのフォームを見直した。腰の反りに気をつける。',
    createdAt: daysAgo(4),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-workout1/600/400' }],
  },
  {
    faceKey: 'friendIncomingWorkout',
    body: '停滞期に突入した気がする。しばらく種目を変えてみる。',
    createdAt: daysAgo(16),
  },

  // unrelatedUser
  {
    faceKey: 'unrelatedDiary',
    body: '今日は近所を散歩した。金木犀の香りがした。',
    createdAt: daysAgo(2),
  },
  {
    faceKey: 'unrelatedDiary',
    body: '掃除をして部屋がすっきりした。気分も軽くなる。',
    createdAt: daysAgo(13),
  },
  {
    faceKey: 'unrelatedPlants',
    body: '観葉植物の葉が増えてきた。成長を感じる。',
    createdAt: daysAgo(6),
    attachments: [{ kind: 'photo', url: 'https://picsum.photos/seed/mock-plants1/600/400' }],
  },
  {
    faceKey: 'unrelatedPlants',
    body: '水やりの頻度を見直した。土の乾き具合を毎日チェックするようにしている。',
    createdAt: daysAgo(19),
  },
];

export const seeds: MockSeed[] = [
  ...buildMemoriesFaceSeeds(),
  ...buildMainExtraFaceSeeds(),
  ...otherUserSeeds,
];

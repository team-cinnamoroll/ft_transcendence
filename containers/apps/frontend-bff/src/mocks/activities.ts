import { type Activity } from "@/types/activity";

// ─── face-1-1: 読書（user-1） ─────────────────────────────────
const face1_1Activities: Activity[] = [
  {
    id: "act-1-1-1",
    faceId: "face-1-1",
    userId: "user-1",
    body: "『三体』読了。宇宙の広大さにめまいがした。ハードSFはやっぱり面白い。続刊もすぐ読みたい。",
    createdAt: "2026-01-05T21:15:00+09:00",
  },
  {
    id: "act-1-1-2",
    faceId: "face-1-1",
    userId: "user-1",
    body: "『坊っちゃん』を再読。子供の頃は主人公に共感しっぱなしだったけど、今読むと周りの大人たちの気持ちもわかって複雑な感情になる。",
    createdAt: "2026-01-20T22:00:00+09:00",
  },
  {
    id: "act-1-1-3",
    faceId: "face-1-1",
    userId: "user-1",
    body: "『1984年』を読み始めた。オーウェルが1940年代に書いたとは思えないほど現代社会と符合する部分が多くて、少し怖い。",
    createdAt: "2026-02-03T20:30:00+09:00",
  },
  {
    id: "act-1-1-4",
    faceId: "face-1-1",
    userId: "user-1",
    body: "『1984年』読了。ビッグブラザーの圧迫感が頭から離れない。ラストの一文「彼は自分がビッグブラザーを愛していることに気づいた」が重すぎる。",
    createdAt: "2026-02-18T23:10:00+09:00",
  },
  {
    id: "act-1-1-5",
    faceId: "face-1-1",
    userId: "user-1",
    body: "図書館で予約していた『夜と霧』がやっと手元に届いた。フランクルの文章は静かで力強い。",
    createdAt: "2026-03-01T18:45:00+09:00",
  },
  {
    id: "act-1-1-6",
    faceId: "face-1-1",
    userId: "user-1",
    body: "『夜と霧』読了。生きることの意味について深く考えさせられた。今年読んだ中で間違いなくベスト1。何度でも読み返したい本。",
    createdAt: "2026-03-15T23:30:00+09:00",
  },
  {
    id: "act-1-1-7",
    faceId: "face-1-1",
    userId: "user-1",
    body: "村上春樹の新作を購入。週末にじっくり読む予定。装丁が好み。",
    createdAt: "2026-03-28T19:00:00+09:00",
  },
];

// ─── face-1-2: 映画（user-1） ─────────────────────────────────
const face1_2Activities: Activity[] = [
  {
    id: "act-1-2-1",
    faceId: "face-1-2",
    userId: "user-1",
    body: "『オッペンハイマー』IMAXで鑑賞。普通のスクリーンで見ないで正解だった。核爆発のシーンは音響が全然違う。3時間があっという間。",
    imageUrls: ["https://picsum.photos/seed/oppenheimer/600/400"],
    createdAt: "2026-01-10T23:00:00+09:00",
  },
  {
    id: "act-1-2-2",
    faceId: "face-1-2",
    userId: "user-1",
    body: "Amazon Primeで『デューン 砂の惑星 PART 2』を視聴。砂漠のビジュアルとスコアの組み合わせが圧倒的。ヴィルヌーヴ監督はスケール感の演出が段違い。",
    createdAt: "2026-01-25T22:30:00+09:00",
  },
  {
    id: "act-1-2-3",
    faceId: "face-1-2",
    userId: "user-1",
    body: "近所のミニシアターで『ドライブ・マイ・カー』の再上映があったので2回目の鑑賞。初見より台詞の一つひとつが刺さった。また泣いた。",
    createdAt: "2026-02-08T21:45:00+09:00",
  },
  {
    id: "act-1-2-4",
    faceId: "face-1-2",
    userId: "user-1",
    body: "子供と一緒に『モアナと伝説の海2』。子供が曲を覚えて帰り道ずっと歌ってた。それだけで十分満足。",
    createdAt: "2026-02-22T18:00:00+09:00",
  },
  {
    id: "act-1-2-5",
    faceId: "face-1-2",
    userId: "user-1",
    body: "映画館で『哀れなるものたち』。ヨルゴス・ランティモスは毎回なんとも言えない後味を残してくれる。好き嫌いは分かれると思うが、映像の独創性は本物。",
    createdAt: "2026-03-10T23:15:00+09:00",
  },
  {
    id: "act-1-2-6",
    faceId: "face-1-2",
    userId: "user-1",
    body: "Netflixで韓国映画を3本。最近こっちにはまり気味かも。特に『パラサイト』以降の韓国映画のレベルの高さを実感している。",
    createdAt: "2026-03-25T22:00:00+09:00",
  },
];

// ─── face-1-3: 料理日記（user-1） ────────────────────────────
const face1_3Activities: Activity[] = [
  {
    id: "act-1-3-1",
    faceId: "face-1-3",
    userId: "user-1",
    body: "チキンカレーを作った。玉ねぎをじっくり炒めるとやっぱり全然違う。1時間かけた甲斐があった。スパイスはクミン・コリアンダー・ターメリック・ガラムマサラの4種。",
    imageUrls: ["https://picsum.photos/seed/curry/600/400"],
    createdAt: "2026-01-08T19:30:00+09:00",
  },
  {
    id: "act-1-3-2",
    faceId: "face-1-3",
    userId: "user-1",
    body: "餃子パーティ。今回は肉汁多め意識で、白菜を塩もみして水分をしっかり絞った。皮は市販品だけど、焼き加減を少し丁寧にしたらパリパリに仕上がって正解だった。",
    imageUrls: ["https://picsum.photos/seed/gyoza/600/400"],
    createdAt: "2026-01-22T20:00:00+09:00",
  },
  {
    id: "act-1-3-3",
    faceId: "face-1-3",
    userId: "user-1",
    body: "ミネストローネ。冷蔵庫の野菜を一掃できてよかった。パスタを入れると昼ごはんにもなるし、スープとして出せるしで用途が広い。",
    createdAt: "2026-02-05T19:00:00+09:00",
  },
  {
    id: "act-1-3-4",
    faceId: "face-1-3",
    userId: "user-1",
    body: "バレンタイン後のセールでカカオ70%チョコが半額になっていたのでガトーショコラを焼いた。しっとり系に仕上がって好評だった。",
    imageUrls: ["https://picsum.photos/seed/gateau/600/400"],
    createdAt: "2026-02-20T21:00:00+09:00",
  },
  {
    id: "act-1-3-5",
    faceId: "face-1-3",
    userId: "user-1",
    body: "鮭のちゃんちゃん焼きに初挑戦。ホットプレートで作ると卓上調理になって楽しい。味噌・バター・砂糖のたれが最高だった。",
    createdAt: "2026-03-05T20:30:00+09:00",
  },
  {
    id: "act-1-3-6",
    faceId: "face-1-3",
    userId: "user-1",
    body: "春キャベツが出てきたので回鍋肉。甜麺醤をたっぷり使うと本格的な味になる。春キャベツの甘みが際立って普通のキャベツより美味しい気がする。",
    createdAt: "2026-03-18T19:45:00+09:00",
  },
  {
    id: "act-1-3-7",
    faceId: "face-1-3",
    userId: "user-1",
    body: "桜餅を作ってみた。道明寺粉が近所のスーパーで手に入って嬉しかった。桜の葉の塩漬けはネットで購入。見た目もかわいく仕上がった。",
    imageUrls: ["https://picsum.photos/seed/sakuramochi/600/400"],
    createdAt: "2026-03-30T17:00:00+09:00",
  },
];

// ─── face-1-4: 今日の出来事（user-1） ───────────────────────
const face1_4Activities: Activity[] = [
  {
    id: "act-1-4-1",
    faceId: "face-1-4",
    userId: "user-1",
    body: "朝から大雪で急遽フル在宅勤務に切り替え。コーヒーを淹れながらのんびり仕事。外が白くなっていると不思議と集中できる。悪くない一日だった。",
    createdAt: "2026-01-15T22:00:00+09:00",
  },
  {
    id: "act-1-4-2",
    faceId: "face-1-4",
    userId: "user-1",
    body: "友人とボードゲームカフェへ。カタン・ドミニオン・アズールを4時間ぶっ通しでプレイ。頭がパンパンになったけどとても楽しかった。",
    createdAt: "2026-01-28T23:30:00+09:00",
  },
  {
    id: "act-1-4-3",
    faceId: "face-1-4",
    userId: "user-1",
    body: "年一の健康診断。血圧・血糖値は問題なし。ただ体重が昨年比2kg増えていた。春から意識して動かないといけない。",
    createdAt: "2026-02-10T18:30:00+09:00",
  },
  {
    id: "act-1-4-4",
    faceId: "face-1-4",
    userId: "user-1",
    body: "転職した友人からLINEで連絡がきてランチへ。環境が変わると本当に人って変わるんだなと実感した。いろんな意味でいい刺激になった。",
    createdAt: "2026-02-25T14:00:00+09:00",
  },
  {
    id: "act-1-4-5",
    faceId: "face-1-4",
    userId: "user-1",
    body: "週末の散歩中に近所の公園で梅が満開だった。スマホで写真を大量に撮ったけど実物の香りはやっぱり写真には残せない。",
    imageUrls: ["https://picsum.photos/seed/plumblossom/600/400"],
    createdAt: "2026-03-08T16:00:00+09:00",
  },
  {
    id: "act-1-4-6",
    faceId: "face-1-4",
    userId: "user-1",
    body: "子供の卒業式。あっという間だなあ、という言葉しか出てこなかった。成長を喜びつつ、少し寂しい気持ちも残る。",
    createdAt: "2026-03-22T20:00:00+09:00",
  },
];

// ─── face-2-1: 読んだ本（user-2） ───────────────────────────
const face2_1Activities: Activity[] = [
  {
    id: "act-2-1-1",
    faceId: "face-2-1",
    userId: "user-2",
    body: "『限りある時間の使い方』読了。タスク管理のハウツー本かと思いきや、実はかなり哲学的な内容だった。「4000週間という人生の有限性を直視せよ」というメッセージが刺さった。",
    createdAt: "2026-01-06T21:30:00+09:00",
  },
  {
    id: "act-2-1-2",
    faceId: "face-2-1",
    userId: "user-2",
    body: "村田沙耶香『コンビニ人間』を読んだ。短いのにすごく密度が高い。主人公の「普通」への違和感の描き方が秀逸で、読み終えてもしばらく考えさせられた。",
    createdAt: "2026-01-19T23:00:00+09:00",
  },
  {
    id: "act-2-1-3",
    faceId: "face-2-1",
    userId: "user-2",
    body: "川上未映子『黄色い家』を読んだ。500ページ以上あるのに全然飽きなかった。貧困と連帯と裏切りの話で、読んでいる間ずっと胸が痛かった。",
    createdAt: "2026-02-02T23:30:00+09:00",
  },
  {
    id: "act-2-1-4",
    faceId: "face-2-1",
    userId: "user-2",
    body: "ついに『ハリー・ポッター』全7巻を読み終えた！今更感はあるけれど、ちゃんと感動した。ハーマイオニーが最初から最後まで好き。",
    createdAt: "2026-02-16T22:00:00+09:00",
  },
  {
    id: "act-2-1-5",
    faceId: "face-2-1",
    userId: "user-2",
    body: "積読消化週間中。穂村弘の歌集を手にとった。短歌の世界に初めてちゃんと入り込めた気がする。「短歌って面白い」を実感した今週。",
    createdAt: "2026-03-03T21:00:00+09:00",
  },
  {
    id: "act-2-1-6",
    faceId: "face-2-1",
    userId: "user-2",
    body: "最近は電子書籍と紙を使い分けてる。電子は移動中に便利、紙は漫画や写真集。紙の漫画を久しぶりに読んだら読み心地の違いを再確認した。",
    createdAt: "2026-03-20T21:30:00+09:00",
  },
];

// ─── face-2-2: カフェ巡り（user-2） ─────────────────────────
const face2_2Activities: Activity[] = [
  {
    id: "act-2-2-1",
    faceId: "face-2-2",
    userId: "user-2",
    body: "表参道の隠れ家カフェへ。豆の産地にこだわりがあって、今日はエチオピア産の浅煎りをチョイス。フルーティーな酸味が絶品で、コーヒーの概念が変わりそうだった。",
    imageUrls: ["https://picsum.photos/seed/omotesando-cafe/600/400"],
    createdAt: "2026-01-11T15:00:00+09:00",
  },
  {
    id: "act-2-2-2",
    faceId: "face-2-2",
    userId: "user-2",
    body: "代官山のドッグカフェへ。友達の柴犬を連れて行ったら他のお客さんにもすごく人気で大変なことに。ラテアートのテラスが気持ちよかった。",
    imageUrls: ["https://picsum.photos/seed/dogcafe/600/400"],
    createdAt: "2026-01-24T14:30:00+09:00",
  },
  {
    id: "act-2-2-3",
    faceId: "face-2-2",
    userId: "user-2",
    body: "新宿の老舗喫茶店でナポリタン。昭和の内装と木のカウンター、鉄板の香り。「喫茶店のナポリタン」という文化を守り続けてほしい。",
    imageUrls: ["https://picsum.photos/seed/napolitano/600/400"],
    createdAt: "2026-02-07T12:30:00+09:00",
  },
  {
    id: "act-2-2-4",
    faceId: "face-2-2",
    userId: "user-2",
    body: "吉祥寺を散歩しながらカフェを3件はしご。カプチーノ×3杯飲んでカフェイン過多になった笑。でも雰囲気の違うお店を巡るのは楽しい。",
    createdAt: "2026-02-21T17:00:00+09:00",
  },
  {
    id: "act-2-2-5",
    faceId: "face-2-2",
    userId: "user-2",
    body: "近所にクラフトビールとコーヒーの専門店がオープンした。昼はコーヒー、夜はビール。居心地が良くて長時間いてしまった。",
    createdAt: "2026-03-07T16:00:00+09:00",
  },
  {
    id: "act-2-2-6",
    faceId: "face-2-2",
    userId: "user-2",
    body: "テラス席が桜の木の真下のカフェに行けた！満開の桜を見ながらコーヒーを飲む贅沢。こういう日のためにカフェ巡りをしているといっても過言ではない。",
    imageUrls: ["https://picsum.photos/seed/sakura-cafe/600/400"],
    createdAt: "2026-03-21T14:00:00+09:00",
  },
];

// ─── face-2-3: 旅行記（user-2） ──────────────────────────────
const face2_3Activities: Activity[] = [
  {
    id: "act-2-3-1",
    faceId: "face-2-3",
    userId: "user-2",
    body: "年末年始に実家の京都へ。元旦の朝5時に伏見稲荷へ行ったら人が少なくて最高だった。千本鳥居を独り占めできる感覚は格別。",
    imageUrls: ["https://picsum.photos/seed/fushimiinari/600/400"],
    createdAt: "2026-01-04T20:00:00+09:00",
  },
  {
    id: "act-2-3-2",
    faceId: "face-2-3",
    userId: "user-2",
    body: "熱海へ日帰り旅行。温泉で肩こりがほぐれて、海鮮丼が美味しくて、帰りに干物を大量に買った。定番コースだけど外れがない。",
    imageUrls: ["https://picsum.photos/seed/atami/600/400"],
    createdAt: "2026-02-12T21:30:00+09:00",
  },
  {
    id: "act-2-3-3",
    faceId: "face-2-3",
    userId: "user-2",
    body: "友達と鎌倉へ。江ノ電に乗って由比ヶ浜まで。夕暮れ時の海辺に座って日が沈むまで話し続けた。こういう時間がいちばん大切だと思う。",
    imageUrls: ["https://picsum.photos/seed/kamakura/600/400"],
    createdAt: "2026-03-14T22:00:00+09:00",
  },
  {
    id: "act-2-3-4",
    faceId: "face-2-3",
    userId: "user-2",
    body: "春休みに台湾旅行の計画をたて始めた。夜市・小籠包・タピオカが主な目的（食べてばかり）。早めに予約しないとフライトが高くなりそう。",
    createdAt: "2026-03-29T21:00:00+09:00",
  },
  {
    id: "act-2-3-5",
    faceId: "face-2-3",
    userId: "user-2",
    body: "旅の記録をまとめるノートを買った。スタンプやチケットを貼れるように厚めのページのもの。旅行前から準備するのも旅の楽しみのひとつだと思っている。",
    createdAt: "2026-03-31T20:00:00+09:00",
  },
];

// ─── face-3-1: ゲーム記録（user-3） ─────────────────────────
const face3_1Activities: Activity[] = [
  {
    id: "act-3-1-1",
    faceId: "face-3-1",
    userId: "user-3",
    body: "エルデンリングのDLCを久しぶりにプレイして1周目クリア。マレニアより強いボスが追加されているとは思わなかった。30回は死んだ。",
    createdAt: "2026-01-07T00:15:00+09:00",
  },
  {
    id: "act-3-1-2",
    faceId: "face-3-1",
    userId: "user-3",
    body: "Balatraにドハマりした。ローグライク×ポーカーという組み合わせが天才的で、気づいたら3時間経っていた。「もう1回だけ」の罠から抜け出せない。",
    createdAt: "2026-01-20T01:00:00+09:00",
  },
  {
    id: "act-3-1-3",
    faceId: "face-3-1",
    userId: "user-3",
    body: "ペルソナ3リロードを開始。リメイク版のグラフィックとUI刷新が凄い。オリジナルも好きだったけど、これはこれで完成度が高い。",
    createdAt: "2026-02-04T23:30:00+09:00",
  },
  {
    id: "act-3-1-4",
    faceId: "face-3-1",
    userId: "user-3",
    body: "FF7リバースをリトライ。クリアした。バトルシステムが本当に楽しい。ケアガ連発しながらもなんとか倒した最終決戦、最高だった。",
    createdAt: "2026-02-19T00:00:00+09:00",
  },
  {
    id: "act-3-1-5",
    faceId: "face-3-1",
    userId: "user-3",
    body: "パルワールドのアップデートが来たので久しぶりに起動。しばらく離れている間に拠点が壊滅していた笑。でもまたイチから作るのも楽しい。",
    createdAt: "2026-03-04T22:00:00+09:00",
  },
  {
    id: "act-3-1-6",
    faceId: "face-3-1",
    userId: "user-3",
    body: "Steamのセールで10本くらい買ってしまった。積みゲーが増える一方だが、セールに罪悪感は今更感じない。積んでいる間が一番楽しいのかもしれない。",
    createdAt: "2026-03-17T21:30:00+09:00",
  },
  {
    id: "act-3-1-7",
    faceId: "face-3-1",
    userId: "user-3",
    body: "インディーゲーム「Hollow Knight Silksong」の発売日が発表されたらしいという噂。本当ならもう待ち切れない。Hollow Knightは人生ゲームのひとつ。",
    createdAt: "2026-03-31T23:00:00+09:00",
  },
];

// ─── face-3-2: アニメ感想（user-3） ────────────────────────
const face3_2Activities: Activity[] = [
  {
    id: "act-3-2-1",
    faceId: "face-3-2",
    userId: "user-3",
    body: "「葬送のフリーレン」を最終話まで見た。旅の終わりというより、旅の始まりを描いた物語だと思う。余韻がすごく心地よかった。",
    createdAt: "2026-01-09T23:30:00+09:00",
  },
  {
    id: "act-3-2-2",
    faceId: "face-3-2",
    userId: "user-3",
    body: "「ダンジョン飯」アニメ版が始まった。原作ファンとしてキャラクターデザインと作画クオリティに感動。特にマルシルの表情が原作そのままで嬉しい。",
    createdAt: "2026-01-23T23:00:00+09:00",
  },
  {
    id: "act-3-2-3",
    faceId: "face-3-2",
    userId: "user-3",
    body: "「BLUE GIANT」のアニメ映画を視聴。友人に強く勧められて観たら予想以上だった。音楽の熱量をアニメで表現する試みが新鮮で、演奏シーンで何度か鳥肌が立った。",
    createdAt: "2026-02-20T22:30:00+09:00",
  },
  {
    id: "act-3-2-4",
    faceId: "face-3-2",
    userId: "user-3",
    body: "今期は当たりが多い。マッシュル、ダンまち、あと配信でいくつか。個人的にダークホースはマッシュル。バトルの演出が毎週面白い。",
    createdAt: "2026-03-06T23:30:00+09:00",
  },
  {
    id: "act-3-2-5",
    faceId: "face-3-2",
    userId: "user-3",
    body: "「推しの子」2期を見直した。初見とアクアの動機を知っている状態での2週目は全然印象が違う。1話から布石があちこちに散りばめられている。",
    createdAt: "2026-03-19T22:00:00+09:00",
  },
];

// ─── face-3-3: 筋トレログ（user-3） ─────────────────────────
const face3_3Activities: Activity[] = [
  {
    id: "act-3-3-1",
    faceId: "face-3-3",
    userId: "user-3",
    body: "新年から筋トレ再開。年末年始でだいぶ落ちていた。ベンチプレスはMAX80kgだったが今日はウォームアップで65kgがきつかった。地道に戻していく。",
    createdAt: "2026-01-06T21:00:00+09:00",
  },
  {
    id: "act-3-3-2",
    faceId: "face-3-3",
    userId: "user-3",
    body: "胸の日。ベンチプレス 5×5 (70kg)。最後のセットが限界ギリギリだった。プロテインを飲み忘れたのと睡眠不足が原因かも。",
    createdAt: "2026-01-21T22:30:00+09:00",
  },
  {
    id: "act-3-3-3",
    faceId: "face-3-3",
    userId: "user-3",
    body: "背中の日。デッドリフト初挑戦で100kgを引けた。腰が少し怖かったのでフォームをYouTubeで確認してからにすればよかった。次回は確認してから挑む。",
    createdAt: "2026-02-03T21:30:00+09:00",
  },
  {
    id: "act-3-3-4",
    faceId: "face-3-3",
    userId: "user-3",
    body: "肩・腕の日。サイドレイズを6kg→8kgに増量。フォーム崩さずにできた。肩は怪我しやすい部位なのでフォーム重視で丁寧に続けたい。",
    createdAt: "2026-02-17T22:00:00+09:00",
  },
  {
    id: "act-3-3-5",
    faceId: "face-3-3",
    userId: "user-3",
    body: "ベンチプレスで75kg×3本上がった！年明けから徐々に戻ってきた。80kgへの復帰が見えてきた感じがする。",
    createdAt: "2026-03-03T21:00:00+09:00",
  },
  {
    id: "act-3-3-6",
    faceId: "face-3-3",
    userId: "user-3",
    body: "体重73.2kg、体脂肪率16.8%。目標は体脂肪13%台。筋肉量が増えてきているのに体脂肪も下がっているのでいい傾向。あと少し。",
    createdAt: "2026-03-17T22:00:00+09:00",
  },
  {
    id: "act-3-3-7",
    faceId: "face-3-3",
    userId: "user-3",
    body: "スクワット90kgで膝が少し痛くなってきた。深さを見直してしゃがみすぎていた可能性。重量より膝の健康が先決なので少し下げて様子を見る。",
    createdAt: "2026-03-29T21:30:00+09:00",
  },
];

// ─── face-3-4: 技術メモ（user-3） ───────────────────────────
const face3_4Activities: Activity[] = [
  {
    id: "act-3-4-1",
    faceId: "face-3-4",
    userId: "user-3",
    body: "ReactのuseCallbackとuseMemoの使い分けをやっと腑に落として理解した気がする。「参照の同一性を保つ」というキーワードで整理できた。useCallbackは関数、useMemoは計算結果。",
    createdAt: "2026-01-14T23:30:00+09:00",
  },
  {
    id: "act-3-4-2",
    faceId: "face-3-4",
    userId: "user-3",
    body: "TypeScriptのsatisfiesオペレーターが便利すぎる。今まで `as` でごまかしていた部分が型安全に書けるようになった。特にオブジェクトのプロパティ補完と型チェックが同時にできるのが最高。",
    createdAt: "2026-01-28T23:00:00+09:00",
  },
  {
    id: "act-3-4-3",
    faceId: "face-3-4",
    userId: "user-3",
    body: "Turborepoでモノレポを試した。ビルドキャッシュが効くとCIの時間が半分以下になった。複数パッケージを抱えるプロジェクトには必須ツールになりそう。",
    createdAt: "2026-02-11T22:30:00+09:00",
  },
  {
    id: "act-3-4-4",
    faceId: "face-3-4",
    userId: "user-3",
    body: "Dockerのマルチステージビルドを導入してイメージサイズを1.2GB→480MBに削減できた。node_modulesを本番イメージに含めない構成にするだけでこんなに変わるとは。",
    createdAt: "2026-02-25T22:00:00+09:00",
  },
  {
    id: "act-3-4-5",
    faceId: "face-3-4",
    userId: "user-3",
    body: "shadcn/uiを使い始めた。「コンポーネントをコピペして自分のコードベースに取り込む」思想、最初は違和感があったけど使い始めると非常に理にかなっている。カスタマイズが自由自在。",
    createdAt: "2026-03-10T23:00:00+09:00",
  },
];

// ─── face-4-1: 料理レシピ（user-4） ─────────────────────────
const face4_1Activities: Activity[] = [
  {
    id: "act-4-1-1",
    faceId: "face-4-1",
    userId: "user-4",
    body: "鶏の唐揚げのベスト配合が固まった。下味は醤油・酒・みりん・生姜・にんにく、30分以上漬け込む。カリカリにするため170℃で揚げてから200℃で二度揚げ。",
    imageUrls: ["https://picsum.photos/seed/karaage/600/400"],
    createdAt: "2026-01-05T20:30:00+09:00",
  },
  {
    id: "act-4-1-2",
    faceId: "face-4-1",
    userId: "user-4",
    body: "市販のルーを使わないビーフシチューに挑戦。デミグラスソース缶＋赤ワイン＋トマトピューレで作ったら本格的な味になった。翌日はクロワッサンに合わせて召し上がれ。",
    imageUrls: ["https://picsum.photos/seed/stew/600/400"],
    createdAt: "2026-01-18T21:00:00+09:00",
  },
  {
    id: "act-4-1-3",
    faceId: "face-4-1",
    userId: "user-4",
    body: "バレンタインに向けてトリュフチョコに挑戦。ガナッシュの硬さの調整が難しく、柔らかくなりすぎて丸めるので一苦労。でも味は最高だった。",
    imageUrls: ["https://picsum.photos/seed/truffle/600/400"],
    createdAt: "2026-02-01T22:00:00+09:00",
  },
  {
    id: "act-4-1-4",
    faceId: "face-4-1",
    userId: "user-4",
    body: "ベイクドチーズケーキ。クリームチーズ300gをたっぷり使ったら濃厚すぎて最高だった。底のビスケット土台はバターで固めるとしっかりした食感になる。",
    imageUrls: ["https://picsum.photos/seed/cheesecake/600/400"],
    createdAt: "2026-02-15T20:00:00+09:00",
  },
  {
    id: "act-4-1-5",
    faceId: "face-4-1",
    userId: "user-4",
    body: "春のお弁当用に菜の花のからし和えを作った。ほろ苦さが春らしくていい。からし多めが好みの人向けかも。",
    createdAt: "2026-02-28T19:00:00+09:00",
  },
  {
    id: "act-4-1-6",
    faceId: "face-4-1",
    userId: "user-4",
    body: "ちらし寿司用の酢飯の黄金比率についにたどり着いた。米2合に対して：酢大さじ3、砂糖大さじ2強、塩小さじ1弱。砂糖多め・塩少なめがポイント。",
    imageUrls: ["https://picsum.photos/seed/chirashi/600/400"],
    createdAt: "2026-03-14T20:30:00+09:00",
  },
  {
    id: "act-4-1-7",
    faceId: "face-4-1",
    userId: "user-4",
    body: "いちごのショートケーキ。スポンジが想像以上にふわふわに仕上がって満足。生クリームは泡立てすぎると分離するので八分立てで止めること。来年も作りたい。",
    imageUrls: ["https://picsum.photos/seed/shortcake/600/400"],
    createdAt: "2026-03-27T21:00:00+09:00",
  },
];

// ─── face-4-2: 映画・ドラマ（user-4） ──────────────────────
const face4_2Activities: Activity[] = [
  {
    id: "act-4-2-1",
    faceId: "face-4-2",
    userId: "user-4",
    body: "「逃げるは恥だが役に立つ」を見返した。時代を感じるセリフも混じっているけど、それも含めて2016年のドラマとして今見ると面白い。みくりさんの言語化力が好き。",
    createdAt: "2026-01-12T23:00:00+09:00",
  },
  {
    id: "act-4-2-2",
    faceId: "face-4-2",
    userId: "user-4",
    body: "『ミッドサマー』を初鑑賞。北欧の明るい陽光の中で進む恐怖という逆説的な演出が巧みだった。怖かったけどビジュアルが美しくて、不思議な達成感がある映画。",
    createdAt: "2026-01-27T22:30:00+09:00",
  },
  {
    id: "act-4-2-3",
    faceId: "face-4-2",
    userId: "user-4",
    body: "大河ドラマ「光る君へ」が面白い。藤原道長が権力者でありながら人間的な弱さも持ち合わせているキャラクター像が今まで見てきた大河と違う。",
    createdAt: "2026-02-23T22:00:00+09:00",
  },
  {
    id: "act-4-2-4",
    faceId: "face-4-2",
    userId: "user-4",
    body: "映画「ミッドナイト・イン・パリ」を再視聴。ウディ・アレンの映画はパリが本当に美しく映る。1920年代のパリにタイムスリップする設定がロマンチックで毎回好きになる。",
    createdAt: "2026-03-08T23:00:00+09:00",
  },
  {
    id: "act-4-2-5",
    faceId: "face-4-2",
    userId: "user-4",
    body: "Netflixドラマ「BEEF」を一気見。道路上のトラブルから始まる2人の因縁を描いた作品で、韓系アメリカ人の主人公に感情移入しすぎてしんどくなった笑。でも名作。",
    createdAt: "2026-03-22T00:00:00+09:00",
  },
];

// ─── face-4-3: 植物育成（user-4） ───────────────────────────
const face4_3Activities: Activity[] = [
  {
    id: "act-4-3-1",
    faceId: "face-4-3",
    userId: "user-4",
    body: "多肉植物の冬越し中。水やりを月1回に絞った。葉が少しシワシワになってきたのが心配だけど、休眠しているだけなので春まで待つ。",
    imageUrls: ["https://picsum.photos/seed/succulent/600/400"],
    createdAt: "2026-01-10T17:00:00+09:00",
  },
  {
    id: "act-4-3-2",
    faceId: "face-4-3",
    userId: "user-4",
    body: "モンステラの新葉が展開してきた！冬なのに生命力が強すぎる。ハート形の葉が根拠なく元気を与えてくれる。窓際の日当たりが良い場所にして正解だった。",
    imageUrls: ["https://picsum.photos/seed/monstera/600/400"],
    createdAt: "2026-01-24T18:30:00+09:00",
  },
  {
    id: "act-4-3-3",
    faceId: "face-4-3",
    userId: "user-4",
    body: "春の開花に向けてラナンキュラスの球根を5球植え込んだ。球根を水に少し濡らして戻してから植えるのがコツらしい。3月〜4月の開花が楽しみ。",
    createdAt: "2026-02-07T16:00:00+09:00",
  },
  {
    id: "act-4-3-4",
    faceId: "face-4-3",
    userId: "user-4",
    body: "多肉のパキフィツム系の葉挿しに成功した。親葉からちっちゃい芽が出てきているのを発見した時の感動は毎回ある。育てている実感が得られる瞬間。",
    imageUrls: ["https://picsum.photos/seed/pachyphytum/600/400"],
    createdAt: "2026-02-21T17:30:00+09:00",
  },
  {
    id: "act-4-3-5",
    faceId: "face-4-3",
    userId: "user-4",
    body: "ラナンキュラスが咲き始めた！赤・オレンジ・黄色の3色が混じってとても鮮やか。薄紙のような花びらが幾重にも重なる形がとにかく好き。",
    imageUrls: ["https://picsum.photos/seed/ranunculus/600/400"],
    createdAt: "2026-03-05T15:30:00+09:00",
  },
  {
    id: "act-4-3-6",
    faceId: "face-4-3",
    userId: "user-4",
    body: "ベランダガーデニングをもう少し本格的にやろうと計画中。ハーブを育てて料理に使うのが目標。バジル・ミント・ローズマリー辺りから始めたい。",
    createdAt: "2026-03-20T19:00:00+09:00",
  },
  {
    id: "act-4-3-7",
    faceId: "face-4-3",
    userId: "user-4",
    body: "ミントとバジルの種を蒔いた。発芽まで1週間前後かかるらしい。毎朝霧吹きで水やりしながら育てるのが今の楽しみになっている。",
    imageUrls: ["https://picsum.photos/seed/seedlings/600/400"],
    createdAt: "2026-03-31T18:00:00+09:00",
  },
];

// ─── user-1 の 2025 年分の履歴アクティビティ（カレンダー映え用）───────────
const face1_historicalActivities: Activity[] = [
  // 2025年4月
  { id: "act-h-1", faceId: "face-1-1", userId: "user-1", body: "『火花』を読了。芸人の世界がこれほど繊細に描かれているとは思わなかった。", createdAt: "2025-04-07T21:00:00+09:00" },
  { id: "act-h-2", faceId: "face-1-4", userId: "user-1", body: "花見。近所の公園の桜がちょうど満開だった。来年もこの景色を見たい。", imageUrls: ["https://picsum.photos/seed/hanami/600/400"], createdAt: "2025-04-05T16:30:00+09:00" },
  { id: "act-h-3", faceId: "face-1-3", userId: "user-1", body: "春菊のごま和え。シンプルだけど旬の野菜はやっぱり美味しい。", createdAt: "2025-04-12T19:00:00+09:00" },
  { id: "act-h-4", faceId: "face-1-2", userId: "user-1", body: "『PERFECT DAYS』鑑賞。役所広司の演技と東京の光の描写が圧巻。", createdAt: "2025-04-20T22:30:00+09:00" },
  { id: "act-h-5", faceId: "face-1-4", userId: "user-1", body: "新年度スタート。今年度は気になったことをこまめに書き留めるようにしたい。", createdAt: "2025-04-01T23:00:00+09:00" },
  // 2025年5月
  { id: "act-h-6", faceId: "face-1-1", userId: "user-1", body: "『ノルウェイの森』再読。10年ぶりに読むと主人公よりも登場人物の脇役が気になった。", createdAt: "2025-05-03T22:00:00+09:00" },
  { id: "act-h-7", faceId: "face-1-3", userId: "user-1", body: "筍ご飯。旬の時期にしか作れない一品。土鍋で炊くと香りが違う。", imageUrls: ["https://picsum.photos/seed/takenoko/600/400"], createdAt: "2025-05-10T19:30:00+09:00" },
  { id: "act-h-8", faceId: "face-1-4", userId: "user-1", body: "GW中に家族でキャンプへ。夜の星空が圧倒的だった。スマホを置いて過ごす時間の贅沢。", createdAt: "2025-05-04T20:00:00+09:00" },
  { id: "act-h-9", faceId: "face-1-2", userId: "user-1", body: "『インサイド・ヘッド2』公開！子供たちが大喜び。大人も感情移入できる良作。", createdAt: "2025-05-18T21:00:00+09:00" },
  { id: "act-h-10", faceId: "face-1-1", userId: "user-1", body: "『82年生まれ、キム・ジヨン』読了。疑似体験として読むことの意味を改めて感じた。", createdAt: "2025-05-25T23:00:00+09:00" },
  // 2025年6月
  { id: "act-h-11", faceId: "face-1-3", userId: "user-1", body: "梅雨入り。蒸し暑い日には冷やし中華が正解。具材を多めに準備すると映える。", createdAt: "2025-06-08T18:30:00+09:00" },
  { id: "act-h-12", faceId: "face-1-4", userId: "user-1", body: "友人の結婚式。スピーチを頼まれた。緊張したけど無事に伝えられた気がする。", createdAt: "2025-06-14T23:30:00+09:00" },
  { id: "act-h-13", faceId: "face-1-2", userId: "user-1", body: "『哀れなるものたち』を再鑑賞。2回目の方がキャラクターの背景が見えてより深く楽しめた。", createdAt: "2025-06-22T22:00:00+09:00" },
  { id: "act-h-14", faceId: "face-1-1", userId: "user-1", body: "梅雨の読書週間。今月は短編集をいくつか読んだ。星野道夫の写真エッセイが特に良かった。", createdAt: "2025-06-28T21:30:00+09:00" },
  // 2025年7月
  { id: "act-h-15", faceId: "face-1-4", userId: "user-1", body: "海水浴。海はやっぱり夏に限る。子供が初めて波に乗れた。", imageUrls: ["https://picsum.photos/seed/beach/600/400"], createdAt: "2025-07-20T17:00:00+09:00" },
  { id: "act-h-16", faceId: "face-1-3", userId: "user-1", body: "夏野菜カレー。トマト・なす・ズッキーニで作った夏限定レシピ。彩りが鮮やかで食欲が増す。", imageUrls: ["https://picsum.photos/seed/summercurry/600/400"], createdAt: "2025-07-06T19:30:00+09:00" },
  { id: "act-h-17", faceId: "face-1-1", userId: "user-1", body: "『夏への扉』を読んだ。SFの古典だけど今でも全然色褪せていない。ハインラインの着想力に感服。", createdAt: "2025-07-14T22:00:00+09:00" },
  { id: "act-h-18", faceId: "face-1-4", userId: "user-1", body: "花火大会。久しぶりに浴衣を着た。混雑しすぎていたけど、それも夏の思い出。", createdAt: "2025-07-26T23:00:00+09:00" },
  // 2025年8月
  { id: "act-h-19", faceId: "face-1-2", userId: "user-1", body: "お盆休みに映画館で3本ハシゴ。夏は映画の季節。ポップコーン食べすぎた。", createdAt: "2025-08-14T21:30:00+09:00" },
  { id: "act-h-20", faceId: "face-1-3", userId: "user-1", body: "スイカゼリーを作った。見た目が涼やかで子供に大好評。夏の定番デザートになりそう。", imageUrls: ["https://picsum.photos/seed/watermelongelatin/600/400"], createdAt: "2025-08-03T16:00:00+09:00" },
  { id: "act-h-21", faceId: "face-1-4", userId: "user-1", body: "帰省。実家でのんびり過ごした。久しぶりに親の料理を食べると落ち着く。", createdAt: "2025-08-11T20:30:00+09:00" },
  { id: "act-h-22", faceId: "face-1-1", userId: "user-1", body: "積読してた『人類の星の時間』をやっと読了。短編集なのにそれぞれのスケールが大きい。", createdAt: "2025-08-24T23:00:00+09:00" },
  { id: "act-h-23", faceId: "face-1-4", userId: "user-1", body: "セミの声が少なくなってきた。夏の終わりを感じる。つい最近夏が始まった気がするのに。", createdAt: "2025-08-28T19:00:00+09:00" },
  // 2025年9月
  { id: "act-h-24", faceId: "face-1-3", userId: "user-1", body: "栗ご飯。秋の訪れを感じるメニュー。栗をむく作業が大変だったが、食べると報われた。", imageUrls: ["https://picsum.photos/seed/chestnutrice/600/400"], createdAt: "2025-09-07T19:30:00+09:00" },
  { id: "act-h-25", faceId: "face-1-2", userId: "user-1", body: "映画館がすいてきた平日に『関心領域』を観た。これほど静かに恐怖を描いた映画は初めて。", createdAt: "2025-09-13T22:30:00+09:00" },
  { id: "act-h-26", faceId: "face-1-1", userId: "user-1", body: "読書の秋。今月は月5冊ペースで読む目標を立てた。まずは積読から消化。", createdAt: "2025-09-01T21:00:00+09:00" },
  { id: "act-h-27", faceId: "face-1-4", userId: "user-1", body: "彼岸花が咲いていた。毎年この時期になると必ず咲いているのが不思議で感慨深い。", createdAt: "2025-09-22T17:00:00+09:00" },
  { id: "act-h-28", faceId: "face-1-1", userId: "user-1", body: "『人間失格』を初めて読んだ。中学生の時に読まなくて良かったかもしれない。", createdAt: "2025-09-18T23:00:00+09:00" },
  // 2025年10月
  { id: "act-h-29", faceId: "face-1-3", userId: "user-1", body: "さつまいもの炊き込みご飯。ほくほくの甘みが秋らしい。子供が「また作って」と言った。", createdAt: "2025-10-11T19:00:00+09:00" },
  { id: "act-h-30", faceId: "face-1-4", userId: "user-1", body: "旅行どころに紅葉狩りへ。今年は色づきが遅かったが、想像以上に绮麗だった。", imageUrls: ["https://picsum.photos/seed/koyo/600/400"], createdAt: "2025-10-19T16:30:00+09:00" },
  { id: "act-h-31", faceId: "face-1-2", userId: "user-1", body: "秋の映画祭でフランス映画特集。字幕を追うのが大変だったが2本完走。新しい監督を発見。", createdAt: "2025-10-05T21:30:00+09:00" },
  { id: "act-h-32", faceId: "face-1-1", userId: "user-1", body: "松尾芭蕉の俳句集を購入。秋に読む俳句は特別な味わいがある。", createdAt: "2025-10-26T22:00:00+09:00" },
  { id: "act-h-33", faceId: "face-1-4", userId: "user-1", body: "ハロウィンで子供たちといくつかの家を廻った。仮装のクオリティが年々上がっている気がする。", createdAt: "2025-10-31T21:00:00+09:00" },
  // 2025年11月
  { id: "act-h-34", faceId: "face-1-1", userId: "user-1", body: "『存在と時間』に再挑戦。ハイデガーは難しいが少しずつ自分の言葉に落とせてきた気がする。", createdAt: "2025-11-08T23:00:00+09:00" },
  { id: "act-h-35", faceId: "face-1-3", userId: "user-1", body: "おでん解禁！大根・はんぺん・卵・こんにゃく・牛筋を朝から煮込む。夜には完璧な味に。", imageUrls: ["https://picsum.photos/seed/oden/600/400"], createdAt: "2025-11-02T20:00:00+09:00" },
  { id: "act-h-36", faceId: "face-1-4", userId: "user-1", body: "クリスマスに向けてイルミネーション巡りを計画中。今年はどこへ行こうか。", createdAt: "2025-11-15T21:00:00+09:00" },
  { id: "act-h-37", faceId: "face-1-2", userId: "user-1", body: "初めてMCUの映画を一気見した。世界観の広さに圧倒される。脱落しながらも楽しんだ。", createdAt: "2025-11-22T23:30:00+09:00" },
  { id: "act-h-38", faceId: "face-1-1", userId: "user-1", body: "今年読んだ本を振り返ってみた。思いのほか量が少なくて来年は目標を上げようと決意。", createdAt: "2025-11-30T22:00:00+09:00" },
  // 2025年12月
  { id: "act-h-39", faceId: "face-1-3", userId: "user-1", body: "年末は恒例のローストチキン。今年は塩麹を使ってみたがジューシーさが段違いだった。", imageUrls: ["https://picsum.photos/seed/roastchicken/600/400"], createdAt: "2025-12-25T20:00:00+09:00" },
  { id: "act-h-40", faceId: "face-1-4", userId: "user-1", body: "大掃除完了。家の隅々まできれいにすると気持ちがリセットされる感覚がある。", createdAt: "2025-12-30T17:00:00+09:00" },
  { id: "act-h-41", faceId: "face-1-1", userId: "user-1", body: "正月用に古典を一冊購入。年始はゆっくり読書で過ごしたい。", createdAt: "2025-12-28T21:00:00+09:00" },
  { id: "act-h-42", faceId: "face-1-2", userId: "user-1", body: "今年の映画ベスト10を作った。邦画の充実ぶりが印象的な一年だった。", createdAt: "2025-12-15T22:30:00+09:00" },
  { id: "act-h-43", faceId: "face-1-4", userId: "user-1", body: "忘年会シーズン。久しぶりに会う友人たちと年末の雰囲気で盛り上がった。", createdAt: "2025-12-07T23:30:00+09:00" },
  { id: "act-h-44", faceId: "face-1-3", userId: "user-1", body: "年末の鍋パーティ。水炊きに柚子胡椒が合う。〆の雑炊まで完食。", createdAt: "2025-12-21T21:00:00+09:00" },
];

export const activities: Activity[] = [
  ...face1_historicalActivities,
  ...face1_1Activities,
  ...face1_2Activities,
  ...face1_3Activities,
  ...face1_4Activities,
  ...face2_1Activities,
  ...face2_2Activities,
  ...face2_3Activities,
  ...face3_1Activities,
  ...face3_2Activities,
  ...face3_3Activities,
  ...face3_4Activities,
  ...face4_1Activities,
  ...face4_2Activities,
  ...face4_3Activities,
];

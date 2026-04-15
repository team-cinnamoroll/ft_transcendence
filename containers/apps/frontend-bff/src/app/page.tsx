import HomeProfile from "@/components/home/HomeProfile";
import HomeClient from "@/components/home/HomeClient";
import FAB from "@/components/ui/FAB";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-bold text-zinc-100">ホーム</h1>
      </header>

      <main>
        {/* 上部: プロフィールエリア（Server Component） */}
        <HomeProfile />

        {/* 中部〜下部: フェイスフィルタ + アクティビティフィード（Client Component） */}
        <HomeClient />
      </main>

      <FAB />
    </div>
  );
}

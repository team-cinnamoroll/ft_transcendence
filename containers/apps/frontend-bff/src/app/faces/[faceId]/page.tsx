import { notFound } from "next/navigation";
import Link from "next/link";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import FaceHeader from "@/components/face/FaceHeader";
import FaceActivityFeed from "@/components/face/FaceActivityFeed";
import FAB from "@/components/ui/FAB";

type Props = {
  params: Promise<{ faceId: string }>;
};

const FaceDetailPage = async ({ params }: Props) => {
  const { faceId } = await params;
  const face = faceRepository.findById(faceId);

  if (!face) {
    notFound();
  }

  const currentUser = userRepository.getCurrentUser();

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/faces"
          className="flex items-center justify-center rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="フェイス一覧に戻る"
        >
          {/* 左矢印アイコン */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h2 className="truncate text-base font-bold text-zinc-100">
          {face.emoji ? `${face.emoji} ${face.name}` : face.name}
        </h2>
      </header>

      <main>
        {/* フェイスヘッダー（絵文字・名前・説明・サブスクボタン） */}
        <div className="border-b border-zinc-800">
          <FaceHeader face={face} isOwner={face.userId === currentUser.id} />
        </div>

        {/* アクティビティ一覧 */}
        <section className="px-4 py-4">
          <FaceActivityFeed face={face} />
        </section>
      </main>

      {/* 自分のフェイスのみ投稿FABを表示 */}
      {face.userId === currentUser.id && (
        <FAB defaultFaceId={face.id} />
      )}
    </div>
  );
};

export default FaceDetailPage;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronDown, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";

const MAX_IMAGES = 4;

type AttachedImage = {
  file: File;
  objectUrl: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** モーダルを開いた時点で選択済みにするフェイスID（省略可） */
  defaultFaceId?: string;
};

const PostModal = ({ isOpen, onClose, defaultFaceId }: Props) => {
  const currentUser = userRepository.getCurrentUser();
  const myFaces = useMemo(() => {
    return faceRepository.listByUserId(currentUser.id);
  }, [currentUser.id]);
  const initialSelectedFaceId = useMemo(() => {
    return defaultFaceId ?? myFaces[0]?.id ?? "";
  }, [defaultFaceId, myFaces]);
  const [selectedFaceId, setSelectedFaceId] = useState<string>(initialSelectedFaceId);
  const [text, setText] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_LENGTH = 5000;

  const selectedFace = myFaces.find((f) => f.id === selectedFaceId);

  // モーダルが閉じたら画像をリセット・objectURL を解放
  useEffect(() => {
    if (!isOpen) {
      setImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.objectUrl));
        return [];
      });
      setText("");
      setSelectedFaceId(initialSelectedFaceId);
    }
  }, [initialSelectedFaceId, isOpen]);

  // アンマウント時の残存 objectURL クリーンアップ
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.objectUrl));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    const newImages: AttachedImage[] = toAdd.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    // 同じファイルを再選択できるようにリセット
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダルパネル */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="投稿"
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-900 shadow-xl"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-bold text-zinc-100">投稿する</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* フェイス選択 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="face-select"
              className="text-xs font-medium text-zinc-400"
            >
              フェイス
            </label>
            <div className="relative">
              <select
                id="face-select"
                value={selectedFaceId}
                onChange={(e) => setSelectedFaceId(e.target.value)}
                className={cn(
                  "w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 pr-10",
                  "text-sm text-zinc-100 outline-none transition-colors",
                  "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50",
                )}
              >
                {myFaces.map((face) => (
                  <option key={face.id} value={face.id}>
                    {face.emoji ? `${face.emoji} ${face.name}` : face.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
            {selectedFace?.description && (
              <p className="text-xs text-zinc-500 leading-relaxed">
                {selectedFace.description}
              </p>
            )}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="post-text"
              className="text-xs font-medium text-zinc-400"
            >
              内容
            </label>
            <textarea
              id="post-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={5}
              placeholder="気軽に書き留めてみましょう…"
              className={cn(
                "w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3",
                "text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50",
              )}
            />
            <p className="text-right text-xs text-zinc-600">
              {text.length} / {MAX_LENGTH.toLocaleString()}
            </p>
          </div>

          {/* 画像添付エリア */}
          <div className="flex flex-col gap-2">
            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {/* 添付ボタン */}
            <button
              type="button"
              disabled={images.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 w-fit",
                images.length >= MAX_IMAGES
                  ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                  : "border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-400 hover:bg-violet-500/10 active:scale-95",
              )}
            >
              <ImagePlus size={15} />
              写真を追加
              {images.length > 0 && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold leading-none",
                  images.length >= MAX_IMAGES
                    ? "bg-zinc-800 text-zinc-600"
                    : "bg-violet-500/20 text-violet-400",
                )}>
                  {images.length}/{MAX_IMAGES}
                </span>
              )}
            </button>
            {/* サムネイルプレビュー */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, index) => (
                  <div key={img.objectUrl} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.objectUrl}
                      alt={`添付画像${index + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                      aria-label={`画像${index + 1}を削除`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 投稿ボタン（モック：押しても何もしない） */}
          <button
            type="button"
            disabled={text.trim().length === 0}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold transition-colors",
              text.trim().length > 0
                ? "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed",
            )}
          >
            投稿する
          </button>
        </div>
      </div>
    </>
  );
};

export default PostModal;

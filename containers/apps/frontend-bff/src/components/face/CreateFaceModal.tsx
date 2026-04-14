"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Face } from "@/types/face";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (face: Face) => void;
};

const CreateFaceModal = ({ isOpen, onClose, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const currentUser = userRepository.getCurrentUser();
    const newFace: Face = faceRepository.create(currentUser.id, {
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      description: description.trim() || undefined,
      isPrivate,
    });

    onCreate(newFace);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setEmoji("");
    setDescription("");
    setIsPrivate(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* モーダルパネル */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="新規フェイスを作成"
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-900 shadow-xl"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-bold text-zinc-100">新規フェイスを作成</h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
          {/* 名前（必須） */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="face-name"
              className="text-xs font-medium text-zinc-400"
            >
              名前
              <span className="ml-1 text-violet-400">*</span>
            </label>
            <input
              id="face-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：読書"
              className={cn(
                "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5",
                "text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50",
              )}
            />
          </div>

          {/* 絵文字（任意） */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="face-emoji"
              className="text-xs font-medium text-zinc-400"
            >
              絵文字
              <span className="ml-1 text-zinc-600">（任意）</span>
            </label>
            <input
              id="face-emoji"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="例：📚"
              className={cn(
                "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5",
                "text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50",
              )}
            />
          </div>

          {/* 説明文（任意） */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="face-description"
              className="text-xs font-medium text-zinc-400"
            >
              説明文
              <span className="ml-1 text-zinc-600">（任意）</span>
            </label>
            <textarea
              id="face-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このフェイスについて説明してください"
              rows={3}
              className={cn(
                "w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5",
                "text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50",
              )}
            />
          </div>

          {/* 公開/非公開トグル */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-zinc-100">非公開</span>
              <span className="text-xs text-zinc-500">
                オンにすると自分だけが閲覧できます
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              onClick={() => setIsPrivate((prev) => !prev)}
              className={cn(
                "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200",
                isPrivate ? "bg-violet-600" : "bg-zinc-600",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  isPrivate ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* 作成ボタン */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "w-full rounded-xl py-2.5 text-sm font-semibold transition-colors",
              isValid
                ? "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700"
                : "cursor-not-allowed bg-zinc-700 text-zinc-500",
            )}
          >
            作成する
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateFaceModal;

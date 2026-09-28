"use client";

import Image from "next/image";
import { useState } from "react";
import { BookGenre } from "@/lib/types/book";

// Library-binding cloth colors per genre, used when a book has no cover.
const CLOTH: Record<BookGenre, string> = {
  FANTASY: "#3b3670",
  SCIFI: "#1d4d5e",
  HORROR: "#5b1f24",
  ROMANCE: "#853a50",
  MYSTERY: "#2a394b",
  THRILLER: "#46302b",
  ADVENTURE: "#3b5a2b",
  DRAMA: "#6d3b1e",
  COMEDY: "#86671a",
  OTHERS: "#484d57",
};

type Size = "thumb" | "card" | "feature";

interface BookCoverProps {
  title: string;
  author?: string;
  genre: string;
  url: string | null;
  size?: Size;
  className?: string;
  priority?: boolean;
}

const imageSizes: Record<Size, string> = {
  thumb: "48px",
  card: "(min-width: 1024px) 200px, 45vw",
  feature: "(min-width: 768px) 320px, 70vw",
};

export function BookCover({
  title,
  author,
  genre,
  url,
  size = "card",
  className = "",
  priority = false,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const cloth = CLOTH[genre as BookGenre] ?? CLOTH.OTHERS;
  const showImage = url && !failed;

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-rule shadow-[0_1px_2px_rgb(28_34_48/0.2),0_8px_16px_-8px_rgb(28_34_48/0.35)] ${className}`}
    >
      {showImage ? (
        <Image
          src={url}
          alt={size === "thumb" ? "" : `Cover of ${title}`}
          fill
          unoptimized
          priority={priority}
          sizes={imageSizes[size]}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="cloth absolute inset-0 flex flex-col text-[#efe2bd]"
          style={{ backgroundColor: cloth }}
          role={size === "thumb" ? undefined : "img"}
          aria-label={size === "thumb" ? undefined : `${title}, no cover image`}
        >
          {/* Spine hinge */}
          <div className="absolute inset-y-0 left-[7%] w-px bg-black/25" aria-hidden />
          {size !== "thumb" && (
            <div className="flex h-full flex-col justify-between px-[14%] py-[16%]" aria-hidden>
              <div>
                <div className="mb-3 h-px bg-current opacity-60" />
                <p
                  className={`font-serif font-semibold leading-[1.15] ${size === "feature" ? "text-2xl" : "text-[0.95rem]"} line-clamp-4`}
                >
                  {title}
                </p>
                <div className="mt-3 h-px bg-current opacity-60" />
              </div>
              {author && (
                <p className={`font-serif italic opacity-85 ${size === "feature" ? "text-base" : "text-xs"} line-clamp-2`}>
                  {author}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

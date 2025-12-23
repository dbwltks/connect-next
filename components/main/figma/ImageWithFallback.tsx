"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.jpg",
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {error ? (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">이미지를 불러올 수 없습니다</span>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          onError={() => {
            if (imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc);
            } else {
              setError(true);
            }
          }}
        />
      )}
    </div>
  );
}

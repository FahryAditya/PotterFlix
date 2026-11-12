"use client";

import Image from "next/image";
import { useState } from "react";
import { buildFallbackPosterSVG } from "@/lib/normalize";

interface PosterImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Poster image with Next.js Image optimization and automatic SVG fallback on error.
 */
export function PosterImage({
  src,
  alt,
  fallbackTitle,
  fallbackSubtitle = "",
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw",
  priority = false,
}: PosterImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const effectiveSrc =
    failedSrc === src || !src
      ? buildFallbackPosterSVG(fallbackTitle, fallbackSubtitle)
      : src;
  const isDataUri = effectiveSrc.startsWith("data:");

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isDataUri}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}

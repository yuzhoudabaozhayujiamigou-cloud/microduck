import { useEffect, type RefObject } from "react";

export function useClipPlayback(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const videos = [...root.querySelectorAll("video")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) video.play().catch(() => undefined);
          else video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    videos.forEach((video) => io.observe(video));
    return () => io.disconnect();
  }, [ref]);
}

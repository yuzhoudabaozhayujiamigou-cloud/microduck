import { useEffect, useRef, useState } from "react";

type Props = {
  active: boolean;
  label?: string;
  className?: string;
};

export function TvStatic({ active, label, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"on" | "fading" | "hidden">(active ? "on" : "hidden");

  useEffect(() => {
    if (active) {
      setPhase("on");
      return;
    }
    setPhase((prev) => (prev === "hidden" ? prev : "fading"));
    const t = window.setTimeout(() => setPhase("hidden"), 220);
    return () => window.clearTimeout(t);
  }, [active]);

  useEffect(() => {
    if (phase === "hidden") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seed = (Math.random() * 0xffffffff) >>> 0 || 0x9e3779b9;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 0x100000000;
    };
    let image: ImageData | null = null;
    const size = () => {
      const w = Math.max(2, Math.round(0.5 * canvas.clientWidth));
      const h = Math.max(2, Math.round(0.5 * canvas.clientHeight));
      if (!image || canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        image = ctx.createImageData(w, h);
      }
    };
    let scan = rand();
    let speed = 0.002 + 0.002 * rand();
    const draw = () => {
      if (!image) return;
      const w = canvas.width;
      const h = canvas.height;
      const data = image.data;
      const contrast = 0.8 + 0.26 * rand();
      let i = 0;
      for (let y = 0; y < h; y++) {
        const mix = rand() < 0.2 ? 0.62 : 0.26;
        let v = 255 * rand();
        for (let x = 0; x < w; x++) {
          let n = (v * mix + ((rand() + rand()) * 127.5 * (1 - mix))) * contrast;
          v = n;
          if (rand() < 0.002) n = 255;
          if (n > 255) n = 255;
          data[i] = n;
          data[i + 1] = n;
          data[i + 2] = n;
          data[i + 3] = 255;
          i += 4;
        }
      }
      ctx.putImageData(image, 0, 0);
      const band = 0.2 * h;
      const y = scan * (h + 2 * band) - band;
      const g = ctx.createLinearGradient(0, y - band / 2, 0, y + band / 2);
      g.addColorStop(0, "rgba(0, 0, 0, 0)");
      g.addColorStop(0.5, "rgba(0, 0, 0, 0.24)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, y - band / 2, w, band);
      scan += speed * (0.5 + rand());
      if (scan > 1) {
        scan = 0;
        speed = 0.002 + 0.002 * rand();
      }
    };
    size();
    if (reduced) {
      draw();
      return;
    }
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 28) return;
      last = now;
      try {
        draw();
      } catch {
        /* ignore */
      }
    };
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div className={`tv-static ${className}`} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none", background: "#0b0b10", opacity: phase === "on" ? 1 : 0, transition: "opacity 220ms ease" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {label ? <span className="av-label" style={{ position: "absolute", top: "clamp(10px, 3%, 20px)", left: "clamp(12px, 3%, 24px)" }}>{label}</span> : null}
    </div>
  );
}

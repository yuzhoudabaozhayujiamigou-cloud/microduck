import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { GALLERY, GALLERY_BY_ID, type GalleryItem } from "../data";
import { useClipPlayback } from "./hooks";

function SoundToggle({ on, onToggle, className = "" }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button type="button" className={`sound-btn${on ? " on" : ""} ${className}`} aria-pressed={on} aria-label={on ? "Mute the clip" : "Play the clip with sound"} onClick={(event) => { event.stopPropagation(); onToggle(); }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {on ? (
          <>
            <path d="M16 9.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
            <path d="M18.5 7.5a7 7 0 0 1 0 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
          </>
        ) : (
          <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
        )}
      </svg>
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}

function Tile({ item, onOpen, fill = false, cover = false, aspect }: { item: GalleryItem; onOpen: (id: string) => void; fill?: boolean; cover?: boolean; aspect?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const mute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.loop = true;
    setSoundOn(false);
  }, []);
  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.muted) {
      mute();
      return;
    }
    video.loop = false;
    video.muted = false;
    video.currentTime = 0;
    video.play().catch(() => undefined);
    setSoundOn(true);
  };
  const mediaStyle = fill
    ? undefined
    : { aspectRatio: aspect ?? `${item.width} / ${item.height}`, objectFit: cover ? "cover" as const : undefined };

  return (
    <div className={`tile${fill ? " fill" : ""}`}>
      {item.video ? (
        <video ref={videoRef} loop muted playsInline preload="none" poster={item.poster} aria-label={item.alt} style={mediaStyle} onEnded={item.audio ? mute : undefined} onPause={() => { if (videoRef.current && !videoRef.current.muted && !videoRef.current.ended) mute(); }}>
          <source src={item.src} type="video/mp4" />
        </video>
      ) : (
        <img src={item.src} alt={item.alt} loading="lazy" decoding="async" style={mediaStyle} />
      )}
      <button type="button" className="tile-open" onClick={() => onOpen(item.id)} aria-label={`${item.video ? "Play clip" : "View photo"}: ${item.alt}`} />
      <span className={`tile-hint ${item.video ? "hint-clip" : "hint-view"}`} aria-hidden="true">
        {item.video ? "Play clip" : "View"}
      </span>
      {item.video && item.audio ? <SoundToggle on={soundOn} onToggle={toggle} /> : null}
    </div>
  );
}

function Lightbox({ items, index, onClose, onStep }: { items: GalleryItem[]; index: number | null; onClose: () => void; onStep: (delta: number) => void }) {
  const item = index === null ? null : items[index];
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, onClose, onStep]);

  useEffect(() => {
    setSoundOn(false);
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => undefined);
    return () => video.pause();
  }, [item?.id]);

  if (!item) return null;

  const stop = (event: MouseEvent) => event.stopPropagation();
  const landscape = item.width >= item.height;

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.alt} onClick={onClose}>
      <div className="lb-frame" onClick={stop}>
        {item.video ? (
          <video ref={videoRef} loop muted playsInline autoPlay preload="auto" poster={item.poster} aria-label={item.alt} style={landscape ? { width: "min(88vw, 1080px)", height: "auto" } : { height: "min(76vh, 860px)", width: "auto" }}>
            <source src={item.src} type="video/mp4" />
          </video>
        ) : (
          <img src={item.src} alt={item.alt} decoding="async" style={landscape ? { width: "min(88vw, 1080px)", height: "auto" } : { height: "min(76vh, 860px)", width: "auto" }} />
        )}
        {item.video && item.audio ? (
          <SoundToggle
            on={soundOn}
            onToggle={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = soundOn;
              video.loop = soundOn;
              if (!soundOn) {
                video.currentTime = 0;
                video.play().catch(() => undefined);
              }
              setSoundOn(!soundOn);
            }}
          />
        ) : null}
      </div>
      <div className="lb-cap" onClick={stop}>
        <div className="meta">
          {(index ?? 0) + 1} / {items.length}
          {item.video ? " · Clip" : ""}
        </div>
        <p>{item.alt}</p>
      </div>
      <button ref={closeRef} className="lb-nav lb-close" type="button" aria-label="Close the gallery viewer" onClick={onClose}>
        ×
      </button>
      <button className="lb-nav lb-prev" type="button" aria-label="Previous item" onClick={(event) => { event.stopPropagation(); onStep(-1); }}>
        ‹
      </button>
      <button className="lb-nav lb-next" type="button" aria-label="Next item" onClick={(event) => { event.stopPropagation(); onStep(1); }}>
        ›
      </button>
    </div>,
    document.body,
  );
}

export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [cols, setCols] = useState(3);
  useClipPlayback(root);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 900px)");
    const mid = window.matchMedia("(min-width: 600px)");
    const sync = () => setCols(wide.matches ? 3 : mid.matches ? 2 : 1);
    sync();
    wide.addEventListener("change", sync);
    mid.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      mid.removeEventListener("change", sync);
    };
  }, []);

  const open = (id: string) => setIndex(GALLERY.findIndex((item) => item.id === id));
  const step = (delta: number) => setIndex((cur) => (cur === null ? cur : (cur + delta + GALLERY.length) % GALLERY.length));
  const g = GALLERY_BY_ID;

  return (
    <section className="section paper wild center" ref={root} id="wild">
      <div className="wrap">
        <p className="eyebrow">Out in the world</p>
        <h2 className="comic-title title-xl">
          <span className="line-fill">In the wild</span>
        </h2>
        <p className="lead">
          The <strong>real robot in real places</strong> - on desks, on the pitch, out at golden hour.
        </p>
        <div className="gallery">
          <Tile item={g.roller} onOpen={open} />
          {cols === 3 && (
            <>
              <div className="g-row">
                <div className="g-col"><Tile item={g.closeup} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.playtime} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.watching} onOpen={open} /></div>
              </div>
              <div className="g-row">
                <div className="g-col">
                  <Tile item={g.kickabout} onOpen={open} fill />
                  <Tile item={g.desk} onOpen={open} fill />
                </div>
                <div className="g-col span-2"><Tile item={g.balance} onOpen={open} /></div>
              </div>
              <div className="g-row">
                <div className="g-col"><Tile item={g.carried} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.screentime} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.skate} onOpen={open} /></div>
              </div>
              <Tile item={g.standup} onOpen={open} />
              <div className="g-row">
                <div className="g-col"><Tile item={g.stickers} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.playroom} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.morning} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.bedroom} onOpen={open} /></div>
              </div>
              <Tile item={g.chorale} onOpen={open} />
              <div className="g-row">
                <div className="g-col span-2"><Tile item={g.grab} onOpen={open} cover aspect="4 / 3" /></div>
                <div className="g-col"><Tile item={g.walkabout} onOpen={open} fill /></div>
              </div>
            </>
          )}
          {cols === 2 && (
            <>
              <div className="g-row">
                <div className="g-col"><Tile item={g.closeup} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.watching} onOpen={open} /></div>
              </div>
              <div className="g-row">
                <div className="g-col"><Tile item={g.playtime} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.carried} onOpen={open} /></div>
              </div>
              <Tile item={g.kickabout} onOpen={open} />
              <Tile item={g.desk} onOpen={open} />
              <Tile item={g.balance} onOpen={open} />
              <div className="g-row">
                <div className="g-col"><Tile item={g.screentime} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.skate} onOpen={open} /></div>
              </div>
              <Tile item={g.standup} onOpen={open} />
              <div className="g-row">
                <div className="g-col"><Tile item={g.stickers} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.playroom} onOpen={open} /></div>
              </div>
              <div className="g-row">
                <div className="g-col"><Tile item={g.morning} onOpen={open} /></div>
                <div className="g-col"><Tile item={g.bedroom} onOpen={open} /></div>
              </div>
              <Tile item={g.chorale} onOpen={open} />
              <div className="g-row">
                <div className="g-col"><Tile item={g.grab} onOpen={open} cover aspect="4 / 3" /></div>
                <div className="g-col"><Tile item={g.walkabout} onOpen={open} /></div>
              </div>
            </>
          )}
          {cols === 1 && GALLERY.filter((item) => item.id !== "roller").map((item) => <Tile key={item.id} item={item} onOpen={open} />)}
        </div>
      </div>
      <Lightbox items={GALLERY} index={index} onClose={() => setIndex(null)} onStep={step} />
    </section>
  );
}

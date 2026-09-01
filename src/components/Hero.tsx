import { useEffect, useRef, useState } from "react";
import { LINKS } from "../data";
import { ComicButton, Seam } from "./ui";
import { TvStatic } from "./TvStatic";

export function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <section className="hero">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        aria-label="Microduck walking around a bedroom, standing on a desk, and skating"
        onPlaying={() => setReady(true)}
        onLoadedData={() => setReady(true)}
      >
        <source src="/assets/microduck/microduck-hero.webm" type="video/webm" />
        <source src="/assets/microduck/microduck-hero.mp4" type="video/mp4" />
      </video>
      <TvStatic active={!ready} />
      <span className="av-label" aria-hidden="true">
        AV-1
      </span>
      <div className="hero-scrim" />
      <div className="hero-copy">
        <div className="hero-copy-inner">
          <h1>
            <span className="line-hero">Microduck</span>
            <span className="line-hero-sub">Made to move · Ready to learn</span>
          </h1>
          <p className="lead on-dark">
            A 25 cm <strong>open-source</strong> biped you train yourself with reinforcement learning. Playable out of the
            box.
          </p>
          <div className="cta-row">
            <ComicButton href={LINKS.store} size="lg" variant="orange-pink">
              Pre-order for $399
            </ComicButton>
          </div>
        </div>
      </div>
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          <div className="marquee-track">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>
                Pre-orders open August 27, 2026 ★ $399 before taxes and shipping ★ Open source ★
              </span>
            ))}
          </div>
        </div>
      </div>
      <Seam />
    </section>
  );
}

export function Squad() {
  return (
    <section className="squad">
      <div className="halftone" />
      <img src="/assets/microduck/photos/squad.webp" alt="Microduck squad" />
    </section>
  );
}

export function LaunchFilm() {
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!playing) return;
    videoRef.current?.play().catch(() => undefined);
  }, [playing]);

  return (
    <section className="section white center" id="film">
      <div className="halftone" />
      <div className="wrap">
        <p className="eyebrow">The launch film · sound on</p>
        <h2 className="comic-title title-xl">
          <span className="line-fill">Roll the</span>
          <span className="line-outline">tape</span>
        </h2>
        <div className="film-frame">
          <div className="film-inner">
            {playing ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  poster="/assets/microduck/launch-film-poster.jpg"
                  preload="auto"
                  aria-label="Play the Microduck launch film (51 seconds, with sound)"
                  onPlaying={() => setCanPlay(true)}
                >
                  <source src="/assets/microduck/launch-film.webm" type="video/webm" />
                  <source src="/assets/microduck/launch-film.mp4" type="video/mp4" />
                </video>
                <TvStatic active={!canPlay} />
              </>
            ) : (
              <button
                className="film-btn"
                type="button"
                aria-label="Play the Microduck launch film (51 seconds, with sound)"
                onClick={() => setPlaying(true)}
              >
                <img className="film-poster" src="/assets/microduck/launch-film-poster.jpg" alt="" />
                <span className="play-burst" aria-hidden="true">
                  <i className="burst-star outer" />
                  <i className="burst-star inner" />
                  <b>PLAY!</b>
                  <em>Sound on</em>
                </span>
                <span className="play-chip" aria-hidden="true">
                  <i className="play-tri" />
                  Play the film · 0:51
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

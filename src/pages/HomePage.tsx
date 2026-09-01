import { useRef } from "react";
import { Gallery } from "../components/Gallery";
import { Hero, LaunchFilm, Squad } from "../components/Hero";
import { useClipPlayback } from "../components/hooks";
import { Flock, OpenSource, Packs, Specs } from "../components/Shop";
import { Colourways, Sim2Real, Tricks } from "../components/Story";

export function HomePage() {
  const tricks = useRef<HTMLDivElement>(null);
  useClipPlayback(tricks);
  return (
    <main>
      <Hero />
      <Squad />
      <LaunchFilm />
      <Sim2Real />
      <div ref={tricks}>
        <Tricks />
      </div>
      <Colourways />
      <Gallery />
      <Packs />
      <Specs />
      <OpenSource />
      <Flock />
    </main>
  );
}

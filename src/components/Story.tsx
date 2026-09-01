import { useState } from "react";
import { COLOURS, MOVES, STEPS, type ColourId } from "../data";
import { cssVars } from "./ui";
import { DuckScene } from "./DuckScene";
import type { DuckPolicy } from "../duck/scene";

export function Sim2Real() {
  return (
    <section className="section dark" id="sim">
      <div className="wrap split">
        <DuckScene mode="showcase" label="3D Microduck alternating between sitting and running in place; its head follows your pointer and it quacks when clicked" />
        <div>
          <p className="eyebrow on-dark">Meet the twin</p>
          <h2 className="comic-title title-lg">
            <span className="line-dark-fill">sim2real</span>
            <span className="line-pink">that works</span>
          </h2>
          <p className="lead on-dark">
            <strong>Trained in sim, deployed on the real robot.</strong> This is the simulated twin the ducks were trained on.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Tricks() {
  return (
    <section className="section paper tricks" id="tricks">
      <div className="halftone" />
      <div className="wrap center">
        <img src="/assets/microduck/photos/tap-tap.webp" alt="" style={{ width: 120, margin: "0 auto 18px" }} />
        <p className="eyebrow">Fun out of the box. Yours to retrain.</p>
        <h2 className="comic-title title-xl">
          <span className="line-fill">Teach it new</span>
          <span className="line-outline">tricks</span>
        </h2>
        <p className="lead">
          Every behaviour is a policy you can <strong>retrain on your own machine</strong>.
        </p>
        <div className="steps">
          {STEPS.map((step) => (
            <article className="step" key={step.n}>
              <p className="n">{step.n}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <div className="moves">
          {MOVES.map((move) => (
            <article className="move" key={move.id}>
              <video loop muted playsInline preload="none" poster={`/assets/microduck/moves-portrait-alpha/posters/${move.id}.png`} aria-label={`${move.label} — simulated Microduck running the policy`}>
                <source src={`/assets/microduck/moves-portrait-alpha/${move.id}.webm`} type="video/webm" />
              </video>
              <div className="move-copy">
                <h3>{move.label}</h3>
                <p>{move.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Colourways() {
  const [colour, setColour] = useState<ColourId>("classic");
  const [policy, setPolicy] = useState<DuckPolicy>("aim");
  return (
    <section className="section dark colour" id="colour">
      <div className="wrap-wide split reverse">
        <div>
          <p className="eyebrow on-dark">One robot, four colourways</p>
          <h2 className="comic-title title-lg">
            <span className="line-dark-fill">Choose your</span>
            <span className="line-pink">colour</span>
          </h2>
          <p className="lead on-dark">
            Every Microduck ships in one of <strong>four colourways</strong>. Same robot, <strong>same brains</strong> underneath
            - pick the shell that best fits you.
          </p>
          <div className="swatches" role="group" aria-label="Colour variant">
            {COLOURS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`swatch${colour === item.id ? " on" : ""}`}
                title={item.label}
                aria-label={`${item.label} colourway`}
                aria-pressed={colour === item.id}
                style={{ background: item.head, ...cssVars({ "--tilt": item.tilt }) }}
                onClick={() => setColour(item.id)}
              />
            ))}
          </div>
          <div className="policy-toggle" role="group" aria-label="On-stage policy">
            <button type="button" className={policy === "aim" ? "on" : ""} aria-pressed={policy === "aim"} onClick={() => setPolicy("aim")}>
              Sit
            </button>
            <button type="button" className={policy === "walk" ? "on" : ""} aria-pressed={policy === "walk"} onClick={() => setPolicy("walk")}>
              Walk
            </button>
          </div>
        </div>
        <DuckScene
          mode="colourways"
          colour={colour}
          policy={policy}
          label={
            policy === "walk"
              ? "Interactive 3D Microduck walking in the selected colourway"
              : "Interactive 3D Microduck sitting in the selected colourway; its head follows your pointer"
          }
        />
      </div>
    </section>
  );
}

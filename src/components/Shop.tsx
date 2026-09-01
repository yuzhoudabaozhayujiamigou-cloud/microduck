import { useEffect, useRef, useState } from "react";
import { LINKS, PACKS, SPECS } from "../data";
import { ComicButton, DiscordIcon } from "./ui";

const TERM = [
  { cmd: "robotctl monitor", cmt: "# status of the robot" },
  { cmd: "robotctl configure", cmt: "# configure the robot" },
  { cmd: "robotctl update", cmt: "# update the robot" },
] as const;

function RobotctlTerm() {
  const root = useRef<HTMLDivElement>(null);
  const [chars, setChars] = useState(0);
  const source = TERM.map((line) => `$ ${line.cmd} ${line.cmt}`).join("\n");
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) {
      setChars(source.length);
      return;
    }
    const el = root.current;
    if (!el) return;
    let timer = 0;
    let n = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const tick = () => {
        n += 1;
        setChars(n);
        if (n < source.length) timer = window.setTimeout(tick, source[n] === "\n" ? 220 : 26);
      };
      tick();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.2, rootMargin: "80px" },
    );
    io.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) start();
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [source, reduce]);

  const shown = source.slice(0, chars);
  return (
    <div className="term" ref={root} aria-label="Terminal session on the robot">
      <div className="term-bar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <p style={{ margin: 0, marginLeft: 8 }}>ssh microduck</p>
      </div>
      <pre>
        {shown.split("\n").map((line, i) => {
          const hash = line.indexOf("#");
          const left = hash >= 0 ? line.slice(0, hash) : line;
          const cmt = hash >= 0 ? line.slice(hash) : "";
          const prompt = left.startsWith("$") ? "$ " : "";
          const cmd = prompt ? left.slice(2) : left;
          return (
            <span key={i}>
              {i > 0 ? "\n" : null}
              {prompt && <span className="prompt">$ </span>}
              <span className="cmd">{cmd}</span>
              {cmt && <span className="cmt">{cmt}</span>}
            </span>
          );
        })}
        {chars < source.length && <span className="caret" aria-hidden="true" />}
      </pre>
    </div>
  );
}

export function Packs() {
  const robot = PACKS[0];
  const rest = PACKS.slice(1);
  return (
    <section className="section white packs center" id="packs">
      <div className="halftone" />
      <div className="wrap">
        <p className="eyebrow">The robot, and what to add to it</p>
        <h2 className="comic-title title-xl">
          <span className="line-fill">Pick your</span>
          <span className="line-outline">pack</span>
        </h2>
        <p className="lead">
          The robot is <strong>everything you need on day one</strong>. The packs add play gear and spare parts.
        </p>
        <div className="pack-grid">
          <article className="pack-feature">
            <img src={robot.image} alt={robot.alt} />
            <div className="pack-copy">
              <p className="price">{robot.price}</p>
              <p className="kicker">{robot.kicker}</p>
              <h3>{robot.name}</h3>
              <p className="box-label">{robot.box}</p>
              <p>{robot.detail}</p>
              <div style={{ marginTop: "1.4rem" }}>
                <ComicButton href={robot.href} size="lg" variant="orange-ink" className="btn-full" ariaLabel="Pre-order the Microduck">
                  Pre-order
                </ComicButton>
              </div>
            </div>
          </article>
          <div className="side-packs">
            {rest.map((pack) => (
              <article className="pack-mini" key={pack.id}>
                <div className="copy">
                  <h3>{pack.name}</h3>
                  <p className="price">{pack.price}</p>
                  <p>{pack.detail}</p>
                  <div style={{ marginTop: "0.9rem" }}>
                    <ComicButton href={pack.href} variant="ghost" ariaLabel={`Pre-order the ${pack.name}`}>
                      Pre-order
                    </ComicButton>
                  </div>
                </div>
                <img src={pack.image} alt={pack.alt} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Specs() {
  return (
    <section className="section paper" id="specs">
      <div className="wrap specs">
        <div>
          <h2 className="comic-title title-md">
            <span className="line-fill">Tech specs</span>
          </h2>
          <ComicButton href={LINKS.pressKit} variant="yellow" external={false}>
            Full sheet in the press kit
          </ComicButton>
        </div>
        <dl className="spec-list">
          {SPECS.map((spec) => (
            <div className="spec" key={spec.label}>
              <dt>{spec.value}</dt>
              <dd>{spec.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function OpenSource() {
  return (
    <section className="section dark" id="source">
      <div className="wrap os-grid">
        <div>
          <p className="eyebrow on-dark">Built in the open</p>
          <h2 className="comic-title title-md">
            <span className="line-dark-fill">Open source</span>
          </h2>
          <p className="lead on-dark">
            The SDK, the simulation and the <strong>full RL training stack</strong> ship as open source. What the robot
            runs is what you can <strong>read, fork and retrain</strong>.
          </p>
        </div>
        <div>
          <RobotctlTerm />
          <div className="badges">
            <div className="badge">
              <b>Apache-2.0</b>
              <p>The whole software stack, permissively licensed</p>
            </div>
            <div className="badge">
              <b>MuJoCo</b>
              <p>The physics sim every policy is trained in</p>
            </div>
            <div className="badge">
              <b>7 policies</b>
              <p>Every shipped move, published and retrainable</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Flock() {
  return (
    <>
      <section className="section paper center flock" id="flock">
        <img className="bomb" src="/brand/bomb.webp" alt="" />
        <div className="wrap">
          <h2 className="comic-title title-xl">
            <span className="line-fill">Join the flock</span>
          </h2>
          <p className="lead">
            Builds on show, <strong>policies to swap</strong>, help when a leg does something strange. The community lives
            on Discord.
          </p>
          <div style={{ marginTop: "2rem" }}>
            <ComicButton href={LINKS.discord} size="lg" variant="orange-ink">
              <DiscordIcon /> Join the Discord
            </ComicButton>
          </div>
        </div>
      </section>
      <section className="cta-end">
        <div className="wrap">
          <p className="eyebrow">End of tape · be kind, rewind</p>
          <h2 className="comic-title title-xl">
            <span className="line-fill">Pre-orders are</span>
            <span className="line-outline">open now</span>
          </h2>
          <p className="lead">
            In four colourways. <strong>Introductory price, before taxes and shipping</strong>.
          </p>
          <div style={{ marginTop: "2rem" }}>
            <ComicButton href={LINKS.store} size="lg" variant="orange-pink">
              Pre-order for $399
            </ComicButton>
          </div>
        </div>
      </section>
    </>
  );
}

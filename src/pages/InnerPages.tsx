import { Link } from "react-router-dom";
import { COLOURS, GALLERY, LINKS, SPECS } from "../data";
import { ComicButton } from "../components/ui";

const FACTS = [
  { label: "What it is", body: "A 25 cm tall biped robot, playful and educational, made by Pollen Robotics, the Bordeaux-based robotics team at Hugging Face. Their second consumer robot, after Reachy Mini." },
  { label: "What it does", body: "Walks with a waddle, sits, crouches, roller-skates, picks objects up with its beak and gets back on its feet from many common fall positions." },
  { label: "Why it matters", body: "It sets out to make building AI on real hardware as approachable as running a model: complex behaviours out of the box, then an open-source stack covering robot control, simulation, RL training and sim-to-real deployment." },
  { label: "Price", body: "$399 before taxes and shipping, introductory." },
  { label: "Pre-orders", body: "Open from August 27, 2026." },
  { label: "First deliveries", body: "Targeted before Christmas 2026." },
  { label: "Markets", body: "North America and Europe at launch." },
  { label: "Colourways", body: "4 at launch: Cream, Graphite, Lavender and Sky." },
] as const;

const SHEET = [
  { label: "Motors", body: "15 degrees of freedom, across articulated legs, head and neck." },
  { label: "Dimensions", body: "25 cm tall, 14 cm wide." },
  { label: "Weight", body: "Under 800 g." },
  { label: "Compute", body: "Rockchip RK3566 with AI accelerator." },
  { label: "Memory", body: "1 GB RAM, 32 GB storage." },
  { label: "Vision", body: "Front camera, with a dedicated camera-use indicator inspired by classic REC lights." },
  { label: "Motion sensing", body: "2 IMUs, one in the body and one in the head." },
  { label: "Range sensing", body: "Compact LiDAR, an 8×8 time-of-flight matrix." },
  { label: "Physical interaction", body: "Articulated grasping beak." },
  { label: "Audio", body: "Microphones and speaker, with a per-robot generated voice." },
  { label: "NFC", body: "2 antennas, one in the head and one in the beak." },
  { label: "Connectivity", body: "Wi-Fi and Bluetooth." },
  { label: "Battery", body: "Removable NP-F550 camera battery, 2600 mAh, around one hour of runtime depending on use." },
  { label: "In the box", body: "Game controller, playable before writing any code, plus autonomous behaviours at launch." },
  { label: "Software", body: "Open-source SDK with virtual training environments, RL training scripts and tools, and a tested sim-to-real workflow." },
] as const;

const COLOUR_COPY: Record<string, string> = {
  classic: "Cream shells, orange trim and beak",
  charcoal: "Graphite shells, yellow trim and beak",
  lavender: "Lavender shells, yellow trim and beak",
  sky: "Sky-blue shells, orange trim and beak",
};

export function BlogPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow on-dark">Announcement · Open source</p>
          <h1 className="comic-title title-lg" style={{ marginInline: "auto" }}>
            <span className="line-hero">Meet Microduck</span>
          </h1>
          <p className="lead on-dark" style={{ marginInline: "auto" }}>
            August 27, 2026 · 6 min read
          </p>
        </div>
      </section>
      <article className="page-body">
        <figure className="blog-hero-img">
          <img src="/assets/microduck/photos/squad.webp" alt="The four Microduck colourways standing together" />
        </figure>
        <p>
          Last year, we launched Reachy Mini, a small desktop robot built for human-robot interaction. Since then, more
          than 10,000 of them have made their way to people around the world. While building Reachy Mini, we kept coming
          back to another question: what would a small robot look like if its main job was not to stay on a desk and
          interact with you, but to move through the world?
        </p>
        <p>Microduck came out of that question.</p>
        <p>
          Microduck is a 25 cm tall biped robot with 15 motors, a camera, a small depth sensor, two IMUs, and an
          articulated beak that can pick up objects. It can walk, sit, crouch, get back up from many common falls, and
          even roller-skate. It weighs less than 800 g, fits on a desk, and is available for pre-order today for $399
          before taxes and shipping.
        </p>
        <h2>A different kind of small robot</h2>
        <p>Microduck is not Reachy Mini with legs.</p>
        <p>
          Reachy Mini was designed around interaction. It sees, listens, speaks, and uses its head and body to
          communicate. Voice is its primary medium, making it an excellent platform for developing conversational AI,
          experimenting with vision models, and building expressive human-robot interactions.
        </p>
        <p>
          Microduck starts from the other side of physical AI: action. How do you teach a robot to move? How do you train
          a behavior in simulation, transfer it to real hardware, see what went wrong, and try again? What changes when
          the robot can leave the desk, carry something, fall over, and recover? It is an ideal platform for developers
          who want to train physical behaviors, experiment with reinforcement learning, and test how AI moves from
          simulation into the real world.
        </p>
        <p>
          A simple way to think about the two robots is that Reachy Mini is a platform for AI that interacts, while
          Microduck is a platform for AI that acts. They share the same philosophy: both should be fun when you first
          turn them on, approachable when you start coding, and powerful enough to become serious development platforms
          as your projects grow.
        </p>
        <h2>Why we made it small</h2>
        <p>
          Learning movement is messy. A robot has to try things, fail, and try again. On a large humanoid, every bad
          attempt can be expensive, difficult to reset, or simply unsafe to run outside a robotics lab.
        </p>
        <p>
          Making Microduck small and light changes that experience. A failed behavior usually ends with a little robot on
          the floor, not a major incident. Its size makes it easier to experiment at home, in a classroom, or on a normal
          workbench. Self-recovery also means you do not have to pick it up after every failed attempt.
        </p>
        <p>The size helps keep the price and setup manageable too. We want learning about legged movement to be possible without buying a large research platform or having access to a dedicated lab.</p>
        <p>Twenty-five centimetres, under 800 grams: it fits in a hand and on the desk between the laptops training it.</p>
        <p>
          The duck character grew naturally from the robot's proportions, beak, and waddling gait. We kept it because it
          makes the robot approachable without hiding the mechanics underneath. It is still clearly a robot, just one that
          does not take itself too seriously.
        </p>
        <p>
          We took the same approach with the industrial design. Microduck is more colorful than Reachy Mini and comes in
          four colorways: Cream, Graphite, Lavender, and Sky. We wanted it to feel lively before it even starts moving,
          and to make a group of robots look like a collection of different characters rather than identical machines.
        </p>
        <h2>Fun first, open underneath</h2>
        <p>
          We did not want Microduck to be a development kit that only becomes interesting after a weekend of setup. It
          comes with learned behaviors so you can start using it straight away. You can make it walk with a gamepad, have
          it follow a laser dot, trigger movements, or let it react to its surroundings. The point is to make the first
          interaction immediate, even if you never write code.
        </p>
        <p>Grab and carry: the whole body lowers, the beak closes, and the object comes along.</p>
        <p>
          Microduck also expresses itself very differently from Reachy Mini. It does not speak with words. Instead, it
          communicates through weird little sounds, closer to a creature than an assistant. Each Microduck gets its own
          audio identity the first time it wakes up, tied to that individual robot so it keeps the same voice for life.
        </p>
        <p>
          Then, if you want to go further, the same robot becomes a complete development platform. Its open-source
          software stack covers robot control, simulation, reinforcement learning, and sim-to-real deployment. The SDK
          and robot software, plus the reinforcement learning and sim-to-real tools, ship with the robot.
        </p>
        <p>
          We will go much deeper into the technical side in future posts. For this launch, the important point is that the
          behaviors shipping with Microduck are not meant to define what the robot can do forever. They are a starting
          point.
        </p>
        <h2>What we hope happens next</h2>
        <p>
          One very unscientific thing we learned internally is that Microduck is about ten times more fun when there are
          several of them. Races, football, or simply robots reacting to one another immediately make the experience feel
          more alive. For developers, it also creates a practical way to explore multi-robot behaviors without a room
          full of expensive hardware.
        </p>
        <figure className="blog-hero-img">
          <img src="/assets/microduck/photos/kickabout.webp" alt="Microducks playing together on a turf pitch" />
          <figcaption>Football is better with three. Races, we are told, are better with four.</figcaption>
        </figure>
        <p>
          We already have a list of behaviors we want to build, but the more interesting list will come from the
          community. A new walking style, a better recovery policy, a classroom experiment, or something we have not
          thought of yet: we want these ideas to be easy to reproduce, modify, and share.
        </p>
        <p>
          That is also where Hugging Face fits naturally. Models are useful because people can build on one another&apos;s
          work. We want physical behaviors to become easier to share in the same way, together with the environments and
          training recipes needed to reproduce them.
        </p>
        <p>
          Microduck will not solve every hard problem in robotics, and that is not the goal. We hope it can make some of
          those problems easier to approach, and give more people a practical way to learn how AI moves from a simulation
          into a real machine.
        </p>
        <h2>Price and availability</h2>
        <p>
          Microduck is available for pre-order today at an introductory price of $399 before taxes and shipping. It comes
          in four colorways: Cream, Graphite, Lavender, and Sky. First deliveries are targeted before Christmas 2026 in
          North America, Europe, and the UK.
        </p>
        <p>
          You can see Microduck and pre-order it, or join the Pollen Robotics Discord to follow the project as it
          develops.
        </p>
        <div className="cta-row" style={{ margin: "2rem 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <ComicButton href={LINKS.store} variant="orange-pink">
            Pre-order for $399
          </ComicButton>
          <ComicButton href={LINKS.discord} variant="paper">
            Discord
          </ComicButton>
        </div>
        <p>
          <Link to="/">Back to Microduck</Link>
        </p>
      </article>
    </main>
  );
}

export function PressKitPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <h1 className="comic-title title-lg" style={{ marginInline: "auto" }}>
            <span className="line-hero">Press kit</span>
          </h1>
          <p className="lead on-dark" style={{ marginInline: "auto" }}>
            Facts, specs, photos, logos - and a human to write to. All plain text, copy and paste away.
          </p>
        </div>
      </section>
      <div className="page-body wide">
        <p className="eyebrow">Fast facts</p>
        <h2>The facts</h2>
        <dl className="spec-list">
          {SPECS.map((spec) => (
            <div className="spec" key={spec.label}>
              <dt>{spec.value}</dt>
              <dd>{spec.label}</dd>
            </div>
          ))}
        </dl>
        <dl className="facts">
          {FACTS.map((fact) => (
            <div className="fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.body}</dd>
            </div>
          ))}
        </dl>

        <p className="eyebrow">Key specifications</p>
        <h2>The specsheet</h2>
        <div className="notes">
          <p className="note">
            <strong>Not final yet.</strong> Camera resolution and field of view, LiDAR range, radio versions and SDK
            languages are still being finalised - and so is any age recommendation. Please treat them as provisional.
          </p>
          <p className="note ink">
            <strong>Open source = software.</strong> The open-source statement covers the software stack. The mechanical
            and electronic design files are not, so please do not describe the robot as open-source hardware.
          </p>
        </div>
        <dl className="facts">
          {SHEET.map((row) => (
            <div className="fact" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.body}</dd>
            </div>
          ))}
        </dl>

        <p className="eyebrow">One robot, four shells</p>
        <h2>Colourways</h2>
        <p>Four printed colourways. Same robot underneath. Swatches are the calibrated shell colours from the press photos.</p>
        <div className="swatch-row">
          {COLOURS.map((item) => (
            <div className="swatch-card" key={item.id}>
              <i style={{ background: item.head }} />
              <strong>{item.label}</strong>
              <div>{item.head}</div>
              <p>{COLOUR_COPY[item.id]}</p>
            </div>
          ))}
        </div>

        <p className="eyebrow">Photography and clips</p>
        <h2>The photos</h2>
        <p>
          The launch shoot: the real robot in real places, as it appears across this site. Click any tile to download —
          stills as WebP, clips as MP4.
        </p>
        <div className="press-photos">
          {GALLERY.map((item) => (
            <a key={item.id} href={item.src} download>
              <img src={item.poster ?? item.src} alt={item.alt} />
              <span>{item.video ? "MP4 · Clip" : "WebP"}</span>
            </a>
          ))}
        </div>

        <p className="eyebrow">Logos and artwork</p>
        <h2>Take the files</h2>
        <p>
          The 12 MB launch pack (die-cut stickers, wordmark, original JPGs) lives on the official CMS. The fact sheet
          below is the same numbers as this page, as a plain-text file.
        </p>
        <div className="press-files">
          <a className="press-file" href="/press/FACT-SHEET.txt" download>
            <b>The fact sheet</b>
            <span>FACT-SHEET.txt</span>
            <p>Facts, dates, pricing, colourways, boilerplate and the press contact.</p>
          </a>
          <a className="press-file" href="https://pollen-robotics.com/microduck/press-kit/" target="_blank" rel="noopener noreferrer">
            <b>Full press pack</b>
            <span>ZIP on pollen-robotics.com</span>
            <p>Launch photos, die-cut stickers as transparent PNGs, the wordmark and the fact sheet.</p>
          </a>
        </div>

        <p className="eyebrow">Boilerplate</p>
        <h2>About the makers</h2>
        <h3>About Microduck</h3>
        <p>
          Microduck is a 25 cm biped robot with 15 motors, a camera, LiDAR and a grasping beak. It is playable out of the
          box, and its open-source software stack lets you train new behaviours in simulation and run them on the robot.
          Pre-orders open at $399, with first deliveries targeted before Christmas 2026.
        </p>
        <h3>About Pollen Robotics</h3>
        <p>
          Pollen Robotics builds open-source robots from Bordeaux, France. Founded in 2016 by former Inria researchers,
          the team joined Hugging Face in April 2025 and is its robotics team. Microduck is their second consumer robot,
          after Reachy Mini.
        </p>

        <p className="eyebrow">Press contact</p>
        <h2>Talk to a human</h2>
        <p>
          Interviews, review units, extra assets: write to{" "}
          <a href="mailto:contact@pollen-robotics.com">contact@pollen-robotics.com</a> and we will get back to you.
        </p>
        <p>
          <Link to="/">Back to Microduck</Link>
        </p>
      </div>
    </main>
  );
}

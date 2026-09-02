import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  cartCount,
  cartFromSearch,
  cartLines,
  cartSubtotal,
  cartToSearch,
  findOrder,
  formatUsd,
  makeOrderId,
  saveOrder,
  setQty,
  type Cart,
} from "../cart";
import {
  COLOURS,
  COLOUR_IMAGES,
  LINKS,
  PACKS,
  SHIP_COUNTRIES,
  STORE_GALLERY,
  STORE_PACK_IMAGE,
  type ColourId,
  type PackId,
  type StoreShot,
} from "../data";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALES =
  "mailto:sales@pollen-robotics.com?subject=Bulk%20Order%20Inquiry%20-%2010%2B%20Units&body=Hello%2C%0A%0AI%20am%20interested%20in%20ordering%2010%20or%20more%20units.";

type Errors = Record<string, string>;

function CartPlusIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" width="20" height="20">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M16.608 9.421V6.906H3.392v8.016c0 .567.224 1.112.624 1.513.4.402.941.627 1.506.627H8.63M8.818 3h2.333c.618 0 1.212.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.344c0-.622.246-1.218.683-1.658A2.33 2.33 0 0 1 8.82 3"
      />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M14.608 12.563v5m2.5-2.5h-5" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.375 8.48516C16.5417 9.15874 16.5417 10.8427 15.375 11.5163L7.875 15.8464C6.70833 16.52 5.25 15.678 5.25 14.3308L5.25 5.67058C5.25 4.32343 6.70833 3.48146 7.875 4.15504L15.375 8.48516Z"
        fill="currentColor"
      />
    </svg>
  );
}

function QtySelector({
  value,
  min = 1,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="store-qty" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2.75 7H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <input
        type="number"
        min={min}
        max={20}
        value={value}
        aria-label="Quantity"
        onChange={(e) => onChange(Math.max(min, Math.min(20, Number(e.target.value) || min)))}
      />
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(Math.min(20, value + 1))}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2.75 7H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 2.75L7 11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function GalleryCell({
  shot,
  onOpen,
}: {
  shot: StoreShot;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (!shot.video) {
      onOpen();
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    void el.play().then(() => setPlaying(true)).catch(() => onOpen());
  };

  return (
    <figure className="store-shot">
      {shot.video ? (
        <video
          ref={videoRef}
          src={shot.video}
          poster={shot.src}
          playsInline
          controls={playing}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <button type="button" className="store-shot-open" onClick={onOpen} aria-label={`Zoom ${shot.alt}`}>
          <img src={shot.src} alt={shot.alt} />
        </button>
      )}
      {shot.video && !playing && (
        <button type="button" className="store-play" onClick={play} aria-label={`Play video: ${shot.alt}`}>
          <img src={shot.src} alt="" />
          <span className="store-play-icon">
            <PlayIcon />
          </span>
        </button>
      )}
    </figure>
  );
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const search = params.toString();
  const [cart, setCart] = useState<Cart>(() => cartFromSearch(search));
  const [buyQty, setBuyQty] = useState(() => Math.max(1, cartFromSearch(search).qty.robot || 1));
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState<StoreShot | null>(null);
  const [sticky, setSticky] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const userCart = useRef(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("US");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (userCart.current) {
      userCart.current = false;
      return;
    }
    const parsed = cartFromSearch(search);
    setCart(parsed);
    setBuyQty(Math.max(1, parsed.qty.robot || 1));
  }, [search]);

  useEffect(() => {
    const next = cartToSearch(cart);
    if (next !== search) navigate({ pathname: "/checkout", search: next }, { replace: true });
  }, [cart, navigate, search]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!Object.keys(errors).length) return;
    document.getElementById("checkout-form")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [errors]);

  const colour = COLOURS.find((item) => item.id === cart.colour) ?? COLOURS[1];
  const shots = useMemo<StoreShot[]>(
    () => [
      { id: `hero-${cart.colour}`, src: COLOUR_IMAGES[cart.colour], alt: `Microduck ${colour.label}` },
      ...STORE_GALLERY,
    ],
    [cart.colour, colour.label],
  );
  const lines = useMemo(() => cartLines(cart), [cart]);
  const subtotal = cartSubtotal(cart);
  const count = cartCount(cart);
  const hasRobot = cart.qty.robot > 0;
  const bulk = cart.qty.robot >= 10;

  const editCart = (next: Cart | ((current: Cart) => Cart)) => {
    userCart.current = true;
    setCart(next);
  };
  const setColour = (id: ColourId) => editCart((current) => ({ ...current, colour: id }));
  const bump = (id: PackId, delta: number) => {
    editCart((current) => setQty(current, id, current.qty[id] + delta));
  };

  const addRobot = () => {
    editCart((current) => setQty(current, "robot", buyQty));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const goCheckout = () => {
    editCart((current) => setQty(current, "robot", Math.max(current.qty.robot, buyQty)));
    document.getElementById("checkout-form")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (count < 1) next.cart = "Add a Microduck or a pack to continue.";
    if (!EMAIL.test(email)) next.email = "Enter a valid email.";
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (address.trim().length < 4) next.address = "Enter a street address.";
    if (city.trim().length < 2) next.city = "Enter a city.";
    if (postal.trim().length < 3) next.postal = "Enter a postal code.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const order = {
      id: makeOrderId(),
      createdAt: new Date().toISOString(),
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      country,
      address: address.trim(),
      city: city.trim(),
      region: region.trim(),
      postal: postal.trim(),
      colour: cart.colour,
      lines: lines.map((line) => ({ id: line.id, name: line.name, qty: line.qty, cents: line.lineCents })),
      subtotalCents: subtotal,
    };
    try {
      saveOrder(order);
    } catch {
      setBusy(false);
      setErrors({ cart: "Could not save this pre-order in the browser." });
      return;
    }
    navigate(`/checkout/thanks?order=${encodeURIComponent(order.id)}`, { replace: true });
  };

  return (
    <main className="store-page">
      <div className="store-banner">
        ⚠️ The community ordered a lot of ducks. We can’t promise Christmas delivery for new microduck orders anymore,
        but we’re ramping up production. First ordered, first shipped. Current estimate for new orders: 4–6 months.
      </div>

      <section className="store-product">
        <div className="store-gallery" aria-label="Product media">
          {shots.map((shot) => (
            <GalleryCell key={shot.id} shot={shot} onOpen={() => setZoom(shot)} />
          ))}
        </div>

        <div className="store-details">
          <h1>Microduck</h1>
          <p className="store-price">{formatUsd(39900)} USD</p>
          <hr className="store-rule" />

          <fieldset className="store-colors">
            <legend>Color</legend>
            <div className="store-color-row" role="radiogroup" aria-label="Color">
              {COLOURS.map((item) => (
                <label key={item.id} className={cart.colour === item.id ? "on" : ""}>
                  <input
                    type="radio"
                    name="color"
                    value={item.label}
                    checked={cart.colour === item.id}
                    onChange={() => setColour(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="store-buy" ref={buyRef}>
            <QtySelector value={buyQty} onChange={setBuyQty} label="Microduck quantity" />
            <button type="button" className={`store-atc${added ? " is-added" : ""}`} onClick={addRobot}>
              <span className="store-atc-label">
                <CartPlusIcon />
                <span>{added ? "Added" : "Add to cart"}</span>
              </span>
            </button>
            <button type="button" className="store-checkout-btn" onClick={goCheckout}>
              Checkout
            </button>
            <button type="button" className="store-more" onClick={goCheckout}>
              More payment options
            </button>
          </div>

          <aside className="store-bulk">
            <p>
              Ordering 10 or more units? Get bulk pricing, dedicated support, and help with import documentation for
              your organization.
            </p>
            <a href={SALES}>
              Contact our sales team <span aria-hidden="true">→</span>
            </a>
          </aside>

          <div className="store-copy">
            <h2>Playful, Programmable, and Built to Move.</h2>
            <p>
              Compact biped robot designed for physical AI, reinforcement learning, and play. With 15 motors, built-in
              sensors, and an open-source software stack, it can walk, crouch, grasp objects, recover from falls, and
              learn entirely new behaviors through simulation and sim-to-real training.
            </p>
            <h3>Key Specifications</h3>
            <ul>
              <li>15 motors for whole-body movement</li>
              <li>Wide-angle front camera</li>
              <li>Compact 8×8 ToF LiDAR</li>
              <li>2 built-in IMUs</li>
              <li>Articulated grasping beak</li>
              <li>Microphones and speaker</li>
              <li>2 NFC antennas (head and beak)</li>
              <li>Rockchip RK3566 + AI accelerator</li>
              <li>1GB RAM + 32GB storage</li>
              <li>Wi-Fi and Bluetooth connectivity</li>
              <li>Removable NP-F550 battery (approx. 1 hour battery life)</li>
              <li>25 cm tall, 780 g</li>
              <li>Gamepad included</li>
            </ul>
            <h3>Ready to Play, Open to Build</h3>
            <p>
              Microduck comes with built-in behaviors and an included controller, so you can start playing right away.
              Developers can use the open-source SDK to create new behaviors, train reinforcement learning policies in
              simulation, and deploy them to the real robot.
            </p>
            <h3>Shipping &amp; Availability</h3>
            <p>
              Pre-order price: <strong>$399 before taxes and shipping.</strong>
            </p>
            <p>First deliveries targeted before Christmas 2026.</p>
            <p>
              Available at launch in US/Canada/EU/UK/Norway/Switzeland/Japan and South Korea. More countries available
              later.
            </p>
          </div>
        </div>
      </section>

      <section className="store-recs" aria-labelledby="recs-title">
        <hr className="store-rule" />
        <h2 id="recs-title">You may also like</h2>
        <div className="store-rec-grid">
          {PACKS.filter((pack) => pack.id !== "robot").map((pack) => (
            <article key={pack.id} className="store-rec">
              <div className="store-rec-media">
                <img src={STORE_PACK_IMAGE[pack.id]} alt={pack.alt} />
                <button type="button" className="store-rec-add" onClick={() => bump(pack.id, 1)}>
                  <CartPlusIcon />
                  <span>Add</span>
                </button>
              </div>
              <h3>{pack.name}</h3>
              <p className="store-rec-price">{pack.price}</p>
            </article>
          ))}
        </div>
      </section>

      <form className="store-order" id="checkout-form" onSubmit={onSubmit} noValidate>
        <div className="store-order-main">
          <p className="store-honest">
            Payment is not live on this site yet. Place a pre-order with your shipping details — we will send a payment
            link before dispatch. Card numbers are not collected or stored.
          </p>
          {errors.cart && <p className="store-error">{errors.cart}</p>}

          <section className="store-panel" aria-labelledby="bag-title" id="bag">
            <h2 id="bag-title">Your bag</h2>
            {PACKS.map((pack) => {
              const qty = cart.qty[pack.id];
              const on = qty > 0;
              return (
                <article className={`store-line${on ? " on" : ""}`} key={pack.id}>
                  <img src={STORE_PACK_IMAGE[pack.id]} alt="" />
                  <div>
                    <h3>{pack.name}</h3>
                    <p>{pack.detail}</p>
                    <p className="store-line-price">{formatUsd(pack.priceCents)}</p>
                    {pack.id === "robot" && on && (
                      <p className="store-line-colour">{colour.label}</p>
                    )}
                  </div>
                  <div className="store-line-qty">
                    {on ? (
                      <QtySelector
                        value={qty}
                        min={0}
                        label={`${pack.name} quantity`}
                        onChange={(n) => editCart((current) => setQty(current, pack.id, n))}
                      />
                    ) : (
                      <button type="button" className="store-line-add" onClick={() => bump(pack.id, 1)}>
                        Add
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!hasRobot && count > 0 && (
              <p className="store-hint">
                Packs ship with the robot.{" "}
                <button type="button" className="store-text-link" onClick={() => bump("robot", 1)}>
                  Add a Microduck
                </button>
              </p>
            )}
            {bulk && (
              <p className="store-hint">
                Ordering 10 or more? <a href={SALES}>Contact sales</a> for bulk pricing and import paperwork.
              </p>
            )}
          </section>

          <section className="store-panel" aria-labelledby="ship-title">
            <h2 id="ship-title">Delivery</h2>
            <p className="store-hint">US, Canada, EU, UK, Norway, Switzerland, Japan and South Korea at launch.</p>
            <div className="store-fields">
              <label className={errors.email ? "bad" : ""}>
                Email
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <span>{errors.email}</span>}
              </label>
              <label className={errors.name ? "bad" : ""}>
                Full name
                <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <span>{errors.name}</span>}
              </label>
              <label>
                Phone <em>(optional)</em>
                <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Country
                <select autoComplete="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {SHIP_COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`wide ${errors.address ? "bad" : ""}`}>
                Address
                <input type="text" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                {errors.address && <span>{errors.address}</span>}
              </label>
              <label className={errors.city ? "bad" : ""}>
                City
                <input type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                {errors.city && <span>{errors.city}</span>}
              </label>
              <label>
                State / region
                <input type="text" autoComplete="address-level1" value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>
              <label className={errors.postal ? "bad" : ""}>
                Postal code
                <input type="text" autoComplete="postal-code" value={postal} onChange={(e) => setPostal(e.target.value)} />
                {errors.postal && <span>{errors.postal}</span>}
              </label>
            </div>
          </section>
        </div>

        <aside className="store-sum store-panel">
          <h2>Order summary</h2>
          {lines.length === 0 && <p className="store-hint">Your bag is empty.</p>}
          <ul>
            {lines.map((line) => (
              <li key={line.id}>
                <img src={STORE_PACK_IMAGE[line.id]} alt="" />
                <span>
                  {line.name}
                  {line.id === "robot" ? ` · ${colour.label}` : ""}
                  {line.qty > 1 ? ` ×${line.qty}` : ""}
                </span>
                <b>{formatUsd(line.lineCents)}</b>
              </li>
            ))}
          </ul>
          <p className="store-sum-row">
            <span>Subtotal</span>
            <b>{formatUsd(subtotal)}</b>
          </p>
          <p className="store-sum-muted">Taxes and shipping due before dispatch.</p>
          <button className="store-atc" type="submit" disabled={busy || count < 1}>
            {busy ? "Placing pre-order…" : `Place pre-order · ${formatUsd(subtotal)}`}
          </button>
          <p className="store-fine">
            By placing this pre-order you agree to the{" "}
            <a href={`${LINKS.pollen}terms`} target="_blank" rel="noopener noreferrer">
              terms of sale
            </a>
            . No live charge is taken on this page.
          </p>
        </aside>
      </form>

      <div className={`store-sticky${sticky ? " is-on" : ""}`} role="region" aria-label="Quick add to cart bar">
        <img src={COLOUR_IMAGES[cart.colour]} alt="" />
        <div>
          <p>Microduck</p>
          <span>{colour.label}</span>
        </div>
        <b>{formatUsd(39900)} USD</b>
        <button type="button" className="store-atc store-atc-sm" onClick={addRobot}>
          <CartPlusIcon />
          {added ? "Added" : "Add to cart"}
        </button>
      </div>

      {zoom && (
        <dialog className="store-zoom" open onClick={() => setZoom(null)}>
          <img src={zoom.src} alt={zoom.alt} />
          <button type="button" className="store-zoom-close" onClick={() => setZoom(null)} aria-label="Close">
            ×
          </button>
        </dialog>
      )}
    </main>
  );
}

export function ThanksPage() {
  const [params] = useSearchParams();
  const id = params.get("order") ?? "";
  const order = id ? findOrder(id) : null;
  if (!order) {
    return (
      <main className="store-page store-thanks">
        <div className="store-banner">Pre-order</div>
        <section className="store-panel store-thanks-card">
          <h1>No order found</h1>
          <p>That pre-order is not in this browser.</p>
          <Link className="store-atc" to="/checkout">
            Back to checkout
          </Link>
        </section>
      </main>
    );
  }
  const colour = COLOURS.find((item) => item.id === order.colour);
  const shipTo = SHIP_COUNTRIES.find((item) => item.code === order.country)?.label ?? order.country;
  return (
    <main className="store-page store-thanks">
      <div className="store-banner">Pre-order placed · first ordered, first shipped</div>
      <section className="store-panel store-thanks-card">
        <p className="store-kicker">You’re in the flock</p>
        <h1>{order.id}</h1>
        <p>
          We saved this pre-order in your browser. A payment link will go to <strong>{order.email}</strong> once live
          payments are connected. New robots currently estimate 4–6 months to ship.
        </p>
        <ul className="store-thanks-lines">
          {order.lines.map((line) => (
            <li key={line.id}>
              <span>
                {line.name}
                {line.id === "robot" && colour ? ` · ${colour.label}` : ""}
                {line.qty > 1 ? ` ×${line.qty}` : ""}
              </span>
              <b>{formatUsd(line.cents)}</b>
            </li>
          ))}
        </ul>
        <p className="store-sum-row">
          <span>Subtotal</span>
          <b>{formatUsd(order.subtotalCents)}</b>
        </p>
        <p className="store-hint">
          Ships to {order.city}, {shipTo}. Card numbers were not stored.
        </p>
        <div className="store-thanks-cta">
          <Link className="store-atc" to="/">
            Back to Microduck
          </Link>
          <a className="store-checkout-btn" href={LINKS.discord} target="_blank" rel="noopener noreferrer">
            Join the Discord
          </a>
        </div>
      </section>
    </main>
  );
}

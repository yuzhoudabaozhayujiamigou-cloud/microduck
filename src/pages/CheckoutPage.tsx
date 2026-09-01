import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  cardBrand,
  cartCount,
  cartFromSearch,
  cartLines,
  cartSubtotal,
  findOrder,
  formatUsd,
  luhnOk,
  makeOrderId,
  saveOrder,
  setQty,
  type Cart,
} from "../cart";
import { COLOURS, LINKS, PACKS, SHIP_COUNTRIES, type PackId } from "../data";
import { ComicButton, cssVars } from "../components/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCard(value: string) {
  const digits = digitsOnly(value).slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function expiryOk(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 1);
  return exp > now;
}

type Errors = Record<string, string>;

export function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const search = params.toString();
  const [cart, setCart] = useState<Cart>(() => cartFromSearch(search));

  useEffect(() => {
    setCart(cartFromSearch(search));
  }, [search]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("US");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Object.keys(errors).length) return;
    document.querySelector(".fields label.bad, .field-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errors]);

  const lines = useMemo(() => cartLines(cart), [cart]);
  const subtotal = cartSubtotal(cart);
  const count = cartCount(cart);
  const hasRobot = cart.qty.robot > 0;
  const bulk = cart.qty.robot >= 10;

  const bump = (id: PackId, delta: number) => {
    setCart((current) => setQty(current, id, current.qty[id] + delta));
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
    const pan = digitsOnly(cardNumber);
    if (!luhnOk(pan)) next.cardNumber = "Enter a valid card number.";
    if (!expiryOk(expiry)) next.expiry = "Enter a valid expiry.";
    if (cvc.replace(/\D/g, "").length < 3) next.cvc = "Enter the security code.";
    if (cardName.trim().length < 2) next.cardName = "Enter the name on the card.";
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
      cardLast4: pan.slice(-4),
      cardBrand: cardBrand(pan),
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
    <main className="check-page">
      <section className="page-hero check-hero">
        <div className="wrap">
          <p className="eyebrow on-dark">Pre-order · $399 before tax and shipping</p>
          <h1 className="comic-title title-lg" style={{ marginInline: "auto" }}>
            <span className="line-hero">Checkout</span>
          </h1>
        </div>
      </section>

      <form className="check-wrap" onSubmit={onSubmit} noValidate>
        <div className="check-main">
          <p className="check-note">
            The community ordered a lot of ducks. New orders currently estimate <strong>4–6 months</strong> to ship —
            first ordered, first shipped. Price is <strong>before taxes and shipping</strong>, invoiced before dispatch.
          </p>

          <section className="check-card" aria-labelledby="bag-title">
            <h2 id="bag-title">Your bag</h2>
            {errors.cart && <p className="field-error">{errors.cart}</p>}
            {PACKS.map((pack) => {
              const qty = cart.qty[pack.id];
              const on = qty > 0;
              return (
                <article className={`bag-line${on ? " on" : ""}`} key={pack.id}>
                  <img src={pack.image} alt="" />
                  <div>
                    <h3>{pack.name}</h3>
                    <p>{pack.detail}</p>
                    <p className="bag-price">{formatUsd(pack.priceCents)}</p>
                    {pack.id === "robot" && on && (
                      <div className="swatches bag-swatches" role="radiogroup" aria-label="Colourway">
                        {COLOURS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`swatch${cart.colour === item.id ? " on" : ""}`}
                            title={item.label}
                            aria-label={item.label}
                            aria-pressed={cart.colour === item.id}
                            style={{ background: item.head, ...cssVars({ "--tilt": item.tilt }) }}
                            onClick={() => setCart((current) => ({ ...current, colour: item.id }))}
                          />
                        ))}
                        <span className="bag-colour">{COLOURS.find((item) => item.id === cart.colour)?.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="qty">
                    {on ? (
                      <>
                        <button type="button" aria-label={`Fewer ${pack.name}`} onClick={() => bump(pack.id, -1)}>
                          −
                        </button>
                        <span>{qty}</span>
                        <button type="button" aria-label={`More ${pack.name}`} onClick={() => bump(pack.id, 1)}>
                          +
                        </button>
                      </>
                    ) : (
                      <button type="button" className="add-pack" onClick={() => bump(pack.id, 1)}>
                        Add
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!hasRobot && count > 0 && (
              <p className="check-hint">
                Packs ship with the robot.{" "}
                <button type="button" className="text-link" onClick={() => bump("robot", 1)}>
                  Add a Microduck
                </button>
              </p>
            )}
            {bulk && (
              <p className="check-hint">
                Ordering 10 or more?{" "}
                <a href={LINKS.sales}>Contact sales</a> for bulk pricing and import paperwork.
              </p>
            )}
          </section>

          <section className="check-card" aria-labelledby="ship-title">
            <h2 id="ship-title">Shipping</h2>
            <p className="check-hint">US, Canada, EU, UK, Norway, Switzerland, Japan and South Korea at launch.</p>
            <div className="fields">
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

          <section className="check-card" aria-labelledby="pay-title">
            <h2 id="pay-title">Payment</h2>
            <p className="check-hint">
              Card details stay in this browser and are not stored. The pre-order is recorded locally until a payment
              provider is connected.
            </p>
            <div className="fields">
              <label className={`wide ${errors.cardName ? "bad" : ""}`}>
                Name on card
                <input type="text" autoComplete="cc-name" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                {errors.cardName && <span>{errors.cardName}</span>}
              </label>
              <label className={`wide ${errors.cardNumber ? "bad" : ""}`}>
                Card number
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="ACCT-000003"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                />
                {errors.cardNumber && <span>{errors.cardNumber}</span>}
              </label>
              <label className={errors.expiry ? "bad" : ""}>
                Expiry
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                />
                {errors.expiry && <span>{errors.expiry}</span>}
              </label>
              <label className={errors.cvc ? "bad" : ""}>
                CVC
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
                />
                {errors.cvc && <span>{errors.cvc}</span>}
              </label>
            </div>
          </section>
        </div>

        <aside className="check-sum check-card">
          <h2>Order</h2>
          {lines.length === 0 && <p className="check-hint">Your bag is empty.</p>}
          <ul>
            {lines.map((line) => (
              <li key={line.id}>
                <span>
                  {line.name}
                  {line.id === "robot" ? ` · ${COLOURS.find((item) => item.id === cart.colour)?.label}` : ""}
                  {line.qty > 1 ? ` ×${line.qty}` : ""}
                </span>
                <b>{formatUsd(line.lineCents)}</b>
              </li>
            ))}
          </ul>
          <p className="sum-row">
            <span>Subtotal</span>
            <b>{formatUsd(subtotal)}</b>
          </p>
          <p className="sum-row muted">
            <span>Tax & shipping</span>
            <span>Due before dispatch</span>
          </p>
          <button className="btn-comic btn-lg btn-orange shadow-pink btn-full" type="submit" disabled={busy || count < 1}>
            {busy ? "Placing pre-order…" : `Pre-order · ${formatUsd(subtotal)}`}
          </button>
          <p className="sum-fine">
            By placing this pre-order you agree to the{" "}
            <a href={`${LINKS.pollen}terms`} target="_blank" rel="noopener noreferrer">
              terms of sale
            </a>
            .
          </p>
        </aside>
      </form>
    </main>
  );
}

export function ThanksPage() {
  const [params] = useSearchParams();
  const id = params.get("order") ?? "";
  const order = id ? findOrder(id) : null;
  if (!order) {
    return (
      <main className="check-page">
        <section className="page-hero check-hero">
          <div className="wrap">
            <h1 className="comic-title title-lg" style={{ marginInline: "auto" }}>
              <span className="line-hero">No order found</span>
            </h1>
            <p className="lead on-dark" style={{ marginInline: "auto" }}>
              That pre-order is not in this browser.
            </p>
            <div style={{ marginTop: "1.6rem" }}>
              <ComicButton href="/checkout" variant="orange-pink">
                Back to checkout
              </ComicButton>
            </div>
          </div>
        </section>
      </main>
    );
  }
  const colour = COLOURS.find((item) => item.id === order.colour);
  const shipTo = SHIP_COUNTRIES.find((item) => item.code === order.country)?.label ?? order.country;
  return (
    <main className="check-page">
      <section className="page-hero check-hero">
        <div className="wrap">
          <p className="eyebrow on-dark">Pre-order placed</p>
          <h1 className="comic-title title-lg" style={{ marginInline: "auto" }}>
            <span className="line-hero">You&apos;re in the flock</span>
          </h1>
          <p className="lead on-dark" style={{ marginInline: "auto" }}>
            {order.id}
          </p>
        </div>
      </section>
      <div className="check-wrap thanks-wrap">
        <section className="check-card">
          <h2>What happens next</h2>
          <p>
            We saved this pre-order in your browser as <strong>{order.id}</strong>. A confirmation will go to{" "}
            <strong>{order.email}</strong> once live payments are connected. New robots currently estimate 4–6 months to
            ship.
          </p>
          <ul className="thanks-lines">
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
          <p className="sum-row">
            <span>Subtotal</span>
            <b>{formatUsd(order.subtotalCents)}</b>
          </p>
          <p className="check-hint">
            Charged to {order.cardBrand ?? "Card"} ···{order.cardLast4} — the full card number was not stored. Ships to{" "}
            {order.city}, {shipTo}.
          </p>
          <div className="cta-row" style={{ marginTop: "1.6rem", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ComicButton href="/" variant="orange-pink">
              Back to Microduck
            </ComicButton>
            <ComicButton href={LINKS.discord} variant="paper">
              Join the Discord
            </ComicButton>
          </div>
        </section>
      </div>
    </main>
  );
}

import { COLOURS, PACKS, type ColourId, type PackId } from "./data";

export type QtyMap = Record<PackId, number>;

export type Cart = {
  colour: ColourId;
  qty: QtyMap;
};

export type PlacedOrder = {
  id: string;
  createdAt: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  colour: ColourId;
  lines: Array<{ id: PackId; name: string; qty: number; cents: number }>;
  subtotalCents: number;
  cardLast4?: string;
  cardBrand?: string;
};

const ORDERS_KEY = "md-orders";

export function emptyQty(): QtyMap {
  return { robot: 0, charger: 0, dev: 0, accessory: 0 };
}

export function defaultCart(): Cart {
  return { colour: "charcoal", qty: { ...emptyQty(), robot: 1 } };
}

function clampQty(n: number, max = 20) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.floor(n)));
}

export function cartFromSearch(search: string): Cart {
  const cart = defaultCart();
  const params = new URLSearchParams(search);
  const colour = params.get("colour");
  if (COLOURS.some((item) => item.id === colour)) cart.colour = colour as ColourId;

  const tokens = [...params.getAll("add"), params.get("items") ?? ""]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const robotQty = Math.min(20, Math.max(1, Number(params.get("qty") || 1) || 1));
  if (tokens.length) {
    cart.qty = emptyQty();
    for (const id of tokens) {
      if (id === "robot") cart.qty.robot = robotQty;
      else if (id === "charger" || id === "dev" || id === "accessory") cart.qty[id] = Math.max(cart.qty[id], 1);
    }
  } else {
    cart.qty.robot = robotQty;
  }
  for (const id of ["charger", "dev", "accessory"] as const) {
    const n = Number(params.get(id));
    if (Number.isFinite(n) && n > 0) cart.qty[id] = clampQty(n);
  }
  return cart;
}

export function cartToSearch(cart: Cart) {
  const params = new URLSearchParams();
  params.set("colour", cart.colour);
  if (cart.qty.robot > 0) params.set("qty", String(cart.qty.robot));
  const added = PACKS.filter((pack) => cart.qty[pack.id] > 0).map((pack) => pack.id);
  if (added.length) params.set("add", added.join(","));
  for (const id of ["charger", "dev", "accessory"] as const) {
    if (cart.qty[id] > 1) params.set(id, String(cart.qty[id]));
  }
  return params.toString();
}

export function cartLines(cart: Cart) {
  return PACKS.filter((pack) => cart.qty[pack.id] > 0).map((pack) => ({
    ...pack,
    qty: cart.qty[pack.id],
    lineCents: pack.priceCents * cart.qty[pack.id],
  }));
}

export function cartCount(cart: Cart) {
  return PACKS.reduce((sum, pack) => sum + cart.qty[pack.id], 0);
}

export function cartSubtotal(cart: Cart) {
  return PACKS.reduce((sum, pack) => sum + pack.priceCents * cart.qty[pack.id], 0);
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function setQty(cart: Cart, id: PackId, qty: number): Cart {
  return { ...cart, qty: { ...cart.qty, [id]: clampQty(qty) } };
}

export function luhnOk(digits: string) {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleIt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (doubleIt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    doubleIt = !doubleIt;
  }
  return sum % 10 === 0;
}

export function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Card";
}

export function saveOrder(order: PlacedOrder) {
  const prev = loadOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...prev].slice(0, 20)));
}

export function loadOrders(): PlacedOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlacedOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function findOrder(id: string) {
  return loadOrders().find((order) => order.id === id) ?? null;
}

export function makeOrderId() {
  const n = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `MD-${Date.now().toString(36).toUpperCase()}-${n}`;
}

/** Public origin for this site. No trailing slash. */
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN ?? "https://huggingface.it.com").replace(
  /\/+$/,
  "",
);

export function siteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${normalized.replace(/\/+$/, "")}`;
}

export const LINKS = {
  home: "/",
  blog: "/blog",
  pressKit: "/press-kit",
  pollen: "https://pollen-robotics.com/",
  reachyMini: "https://pollen-robotics.com/reachy-mini/",
  reachy2: "https://pollen-robotics.com/reachy-2/",
  checkout: "/checkout",
  store: "/checkout",
  charger: "/checkout?add=charger",
  devPack: "/checkout?add=dev",
  accessory: "/checkout?add=accessory",
  sales: "mailto:sales@pollen-robotics.com",
  cookies: "https://pollen-robotics.com/cookies/",
  discord: "https://discord.com/invite/pollen-community-519098054377340948",
  huggingFace: "https://huggingface.co/",
  x: "https://x.com/pollenrobotics",
  linkedin: "https://www.linkedin.com/company/pollen-robotics",
  youtube: "https://www.youtube.com/@pollenrobotics",
} as const;

export const COLOURS = [
  { id: "classic", label: "Cream", head: "#f7e6cb", trim: "#ff7a2f", tilt: "-2deg" },
  { id: "charcoal", label: "Graphite", head: "#6c6a68", trim: "#ffd23f", tilt: "1.6deg" },
  { id: "lavender", label: "Lavender", head: "#bfa9cf", trim: "#ffd23f", tilt: "-1.4deg" },
  { id: "sky", label: "Sky", head: "#a9dbe8", trim: "#ff7a2f", tilt: "2.2deg" },
] as const;

export type ColourId = (typeof COLOURS)[number]["id"];

export const MOVES = [
  { id: "walk", label: "Walk", detail: "Velocity-tracking gait." },
  { id: "sitstand", label: "Sit & stand", detail: "Sits down, holds the pose, stands back up on its own." },
  { id: "kickL", label: "Kick", detail: "A one-shot boot, then straight back to walking." },
  { id: "grab", label: "Grab", detail: "Dips the beak to the ground, scoops, and pops back upright." },
  { id: "drive", label: "Roller skating", detail: "Roller skating locomotion when the skates are equipped." },
  { id: "standup", label: "Get back up", detail: "Flat on its back to standing, all by itself, ready for the next command." },
] as const;

export const STEPS = [
  { n: "01", title: "Train in simulation", body: "Behaviours are learned in physics sim, on your machine or on Hugging Face Jobs." },
  { n: "02", title: "Deploy on the robot", body: "One step from simulation to the real thing." },
  { n: "03", title: "Refine the simulation", body: "Tune, re-train, re-deploy." },
  { n: "04", title: "Publish the policy", body: "Share your new behavior with the community!" },
] as const;

export const SPECS = [
  { value: "15", label: "Motors" },
  { value: "25 cm", label: "Tall" },
  { value: "800 g", label: "To pick up" },
  { value: "Camera", label: "Plus LiDAR and two IMUs" },
  { value: "7", label: "Trained moves in the box" },
  { value: "50 Hz", label: "Onboard policy loop" },
] as const;

export type GalleryItem = {
  id: string;
  src: string;
  poster?: string;
  video?: boolean;
  audio?: boolean;
  width: number;
  height: number;
  alt: string;
};

const G = "/assets/microduck/gallery";
const P = "/assets/microduck/photos";

export const GALLERY: GalleryItem[] = [
  { id: "roller", src: `${G}/roller-skating.mp4`, poster: `${G}/roller-skating-poster.jpg`, video: true, width: 1280, height: 720, alt: "The roller variant of Microduck skating around a living room" },
  { id: "closeup", src: `${P}/closeup.webp`, width: 1012, height: 1800, alt: "Close-up of a Microduck standing on a desk in warm light" },
  { id: "playtime", src: `${P}/playtime.webp`, width: 1012, height: 1800, alt: "A woman laughing while playing with a Microduck at a table" },
  { id: "watching", src: `${P}/watching.webp`, width: 1012, height: 1800, alt: "A Microduck on a desk looking into the camera while someone codes behind it" },
  { id: "kickabout", src: `${P}/kickabout.webp`, width: 1800, height: 1014, alt: "Two Microducks playing with a ball on a turf pitch" },
  { id: "desk", src: `${P}/desk.webp`, width: 1800, height: 1012, alt: "Overhead view of a desk with Microducks, a game controller and a sticker sheet" },
  { id: "balance", src: `${G}/balance-recovery.mp4`, poster: `${G}/balance-recovery-poster.jpg`, video: true, width: 1280, height: 720, alt: "Microduck recovering its balance after being pushed by hand" },
  { id: "carried", src: `${P}/carried.webp`, width: 1012, height: 1800, alt: "A Microduck carried under an arm" },
  { id: "screentime", src: `${P}/screentime.webp`, width: 1012, height: 1800, alt: "A Microduck standing in front of a laptop screen in teal light" },
  { id: "skate", src: `${P}/skate.webp`, width: 1012, height: 1800, alt: "Microduck outdoors at golden hour, next to a skater's shoe" },
  { id: "standup", src: `${G}/squad-standup.mp4`, poster: `${G}/squad-standup-poster.jpg`, video: true, width: 1280, height: 720, alt: "Four Microducks in the four colourways standing up from a living-room floor together" },
  { id: "stickers", src: `${P}/stickers.webp`, width: 1012, height: 1800, alt: "A hand sticking a lips sticker onto a Microduck's beak, sticker sheets spread on the table" },
  { id: "playroom", src: `${P}/playroom.webp`, width: 1012, height: 1800, alt: "A Microduck standing on a pink rug in a child's playroom" },
  { id: "morning", src: `${P}/morning.webp`, width: 1012, height: 1800, alt: "A Microduck on a desk in warm morning light, next to a monitor and a game controller" },
  { id: "bedroom", src: `${P}/bedroom.webp`, width: 1012, height: 1800, alt: "A Microduck standing on a bedroom rug while its owner codes on the bed behind it" },
  { id: "chorale", src: `${G}/chorale.mp4`, poster: `${G}/chorale-poster.jpg`, video: true, audio: true, width: 1280, height: 720, alt: "Four Microducks in the four colourways singing together like a choir" },
  { id: "grab", src: `${G}/grab-and-carry.mp4`, poster: `${G}/grab-and-carry-poster.jpg`, video: true, width: 720, height: 1280, alt: "Microduck grabbing an object with its beak and carrying it to a box" },
  { id: "walkabout", src: `${P}/walkabout.webp`, width: 1350, height: 1800, alt: "A Microduck walking across a green games table surrounded by people" },
];

export const GALLERY_BY_ID = Object.fromEntries(GALLERY.map((item) => [item.id, item])) as Record<string, GalleryItem>;

export const PACKS = [
  {
    id: "robot",
    name: "Microduck",
    kicker: "The robot",
    price: "$399",
    priceCents: 39900,
    box: "In the box",
    detail: "Robot, battery, USB-C cable, game controller.",
    href: "/checkout?add=robot",
    image: "/assets/microduck/photos/pack-robot.webp",
    alt: "Illustrated Microduck robot standing on a desk",
    featured: true,
  },
  {
    id: "charger",
    name: "Charger pack",
    price: "$39",
    priceCents: 3900,
    detail: "Dual charger, 2x batteries.",
    href: "/checkout?add=charger",
    image: "/assets/microduck/photos/pack-charger.webp",
    alt: "Illustrated dual charger, two spare batteries and a USB-C cable",
  },
  {
    id: "dev",
    name: "Dev pack",
    price: "$119",
    priceCents: 11900,
    detail: "3x spare motors, 5x motor cables, 2x batteries, dual charger, 10x NFC tags, Hugging Face credit, screwdriver, screw pack.",
    href: "/checkout?add=dev",
    image: "/assets/microduck/photos/pack-dev.webp",
    alt: "Illustrated spare motors, cables, batteries, charger, NFC tags and tools",
  },
  {
    id: "accessory",
    name: "Accessory pack",
    price: "$39",
    priceCents: 3900,
    detail: "Laser pointer, NFC polaroid, 2x rollers, ball, 10x NFC tags.",
    href: "/checkout?add=accessory",
    image: "/assets/microduck/photos/pack-accessories.webp",
    alt: "Illustrated rollers, ball, laser pointer, NFC polaroid and tags",
  },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

export const PACK_BY_ID = Object.fromEntries(PACKS.map((pack) => [pack.id, pack])) as Record<PackId, (typeof PACKS)[number]>;

export const SHIP_COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "PT", label: "Portugal" },
  { code: "AT", label: "Austria" },
  { code: "SE", label: "Sweden" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "NO", label: "Norway" },
  { code: "CH", label: "Switzerland" },
  { code: "PL", label: "Poland" },
  { code: "CZ", label: "Czechia" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
] as const;

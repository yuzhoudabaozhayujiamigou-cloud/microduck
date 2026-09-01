import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const spaRoutes = [
  "/blog",
  "/blog/introducing-microduck",
  "/press-kit",
  "/checkout",
  "/checkout/thanks",
];

const index = join("dist", "index.html");
copyFileSync(index, join("dist", "404.html"));
writeFileSync(join("dist", ".nojekyll"), "");
for (const route of spaRoutes) {
  const target = join("dist", route.slice(1), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(index, target);
}

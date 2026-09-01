# Microduck production deploy

The site is on **GitHub Pages**. `https://huggingface.it.com` is **not live yet** — DNS still points at Spaceship parking.

## Live now

- Host: GitHub Pages (`build_type: workflow`)
- Repo: https://github.com/yuzhoudabaozhayujiamigou-cloud/microduck
- Pages custom domain attached: `huggingface.it.com`
- github.io currently **301 redirects** to `http://huggingface.it.com/` (parking until DNS changes)
- SPA: `dist/404.html` copy of `index.html`, plus `blog/`, `press-kit/`, `checkout/` index copies (HTTP 200 for those paths)

## DNS still required (Spaceship)

Registrar / nameservers: Spaceship (`launch1.spaceship.net`, `launch2.spaceship.net`).
Dashboard: https://www.spaceship.com/ → domain **huggingface.it.com** → DNS.

**Delete** the current apex A records (Spaceship parking):

| Type | Host | Value |
| --- | --- | --- |
| A | `@` / `huggingface.it.com` | `54.149.79.189` |
| A | `@` / `huggingface.it.com` | `34.216.117.25` |

**Add** GitHub Pages apex records:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `yuzhoudabaozhayujiamigou-cloud.github.io` |

Do not keep a CNAME on `@` unless Spaceship ALIAS/ANAME flattening is used instead of the A/AAAA set above.

After DNS propagates (often minutes, up to 48h):

1. Open https://github.com/yuzhoudabaozhayujiamigou-cloud/microduck/settings/pages
2. Confirm `huggingface.it.com` is verified (DNS check)
3. Enable **Enforce HTTPS**
4. Check `/`, `/blog`, `/press-kit`, `/checkout` (SPA fallback)

## What was already done

- `npm run build` succeeded (`tsc -b` + Vite + `scripts/spa-fallback.mjs`)
- GitHub repo created; site tree published; Pages workflow **success** (run `33541824035`)
- Pre-order goes to `/checkout` only in this tree

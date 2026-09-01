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
5. Only then add the site in Google Search Console (see below). Do not submit the Spaceship parking page.

## Google Search indexing

`robots.txt` allows `/`, `/blog`, and `/press-kit`, and disallows `/checkout` (checkout is also `noindex` in the app). `sitemap.xml` lists only those public URLs. Googlebot is not blocked.

**Do not** add the domain in Search Console, ping Google, or submit the sitemap while DNS still shows the Spaceship parking page.

When `https://huggingface.it.com` serves this Microduck site (not parking):

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add URL-prefix property `https://huggingface.it.com`
3. Verify ownership:
   - **HTML tag:** copy the `content=` token from Search Console, set GitHub Actions secret `VITE_GOOGLE_SITE_VERIFICATION` (no fake token), rebuild Pages. The build injects `<meta name="google-site-verification">` only when that env is set.
   - Or use a DNS TXT record on the domain.
4. Sitemaps → Add new sitemap → `https://huggingface.it.com/sitemap.xml`

Optional ping (deprecated, harmless once the real site is live):

`https://www.google.com/ping?sitemap=https://huggingface.it.com/sitemap.xml`

## What was already done

- `npm run build` succeeded (`tsc -b` + Vite + `scripts/spa-fallback.mjs`)
- GitHub repo created; site tree published; Pages workflow **success** (run `33541824035`)
- Pre-order goes to `/checkout` only in this tree
- Indexing files prepared (`public/robots.txt`, `public/sitemap.xml`); Google was **not** pinged while the apex still parks

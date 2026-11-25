# Team League

Friends draft whole pro teams, not individual players. Each team’s real wins add up, and the best combined record at the end of the season wins.

This repository is the public hub for those leagues. It is a static site: no build step and no app dependencies. GitHub Pages serves it from the `main` branch root at `https://michaelrippe.github.io/teamleague/`. Asset paths are relative so the same files work after a custom domain is added.

## Structure

```
index.html            Landing page
.nojekyll             Tell GitHub Pages to serve the files as-is
assets/leagues.js     The only league list
assets/hub.js         Renders cards and the archive from that list
assets/interest.js    Shared “notify me” forms (POST only)
assets/styles.css     Shared dark theme
assets/favicon.svg
```

`index.html` is the hub: the name, a short how-it-works, one card per current league, an archive, and a general “next season” signup. JavaScript is only there to read `assets/leagues.js` and to submit the notify forms.

## Add or flip a league

Edit the `TEAM_LEAGUES` array in `assets/leagues.js`. Each entry has:

| Field | Role |
| --- | --- |
| `id` | Stable slug. Off-season forms submit as `teamleague-hub-<id>`. |
| `name` | Card or archive title. |
| `icon` | Sport emoji. |
| `status` | `live`, `offseason`, or `archive`. |
| `url` | League site. Also the results link unless `resultsUrl` is set. |
| `season` | Short season note under the name. |
| `start`, `end` | Optional `YYYY-MM-DD` local dates. |
| `resultsLabel` | Optional text for the off-season results link. |
| `resultsUrl` | Optional results link when it differs from `url`. |

What people see:

- `live` — main card and an **Enter league** link. No notify form.
- `offseason` — main card, an inline **Get notified** form, and a small results link (`resultsLabel`, or “Last season's results”).
- `archive` — a row in **Archive** only. No main card and no notify form. The row links to that season’s results.

`start` and `end` override `status`, except `archive`, which always stays in the archive. Before `start` or after `end` the card is off-season; any other day in the window is live. Leave both dates off to pin `status` yourself. Dates are local calendar days (`2027-03-24` means that morning in the viewer’s time zone).

Example — pin a league in season:

```js
{
  id: "nba",
  name: "NBA 2025–26",
  icon: "🏀",
  status: "live",
  url: "https://michaelrippe.github.io/nbatl26/",
  season: "2025–26 season",
}
```

Example — let opening day flip a league on, and keep last year’s results on the card until then:

```js
{
  id: "mlb",
  name: "MLB",
  icon: "⚾",
  status: "offseason",
  start: "2027-03-24",
  url: "https://michaelrippe.github.io/mlbtl26/",
  season: "Opens Mar 24, 2027",
  resultsLabel: "2026 results",
}
```

The archive currently holds NBA 2024–25 (`https://michaelrippe.github.io/nbatl/`) and Fantasy MLB (`https://michaelrippe.github.io/fantasymlbtl/`). Both are `status: "archive"`.

Preview locally from the repo root:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Notify forms

Every signup form is built for `assets/interest.js`. A person sends name (optional, 60 characters) and email (required, 120 characters). The module trims the email, lowercases it, and POSTs JSON to `https://mlbtl26-default-rtdb.firebaseio.com/interest.json`:

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "site": "teamleague-hub",
  "ts": { ".sv": "timestamp" }
}
```

The general card uses `site: "teamleague-hub"`. A league card uses `site: "teamleague-hub-<id>"`. A filled honeypot field named `website` shows the thank-you message and does not send. Success stores `localStorage.tl_interest = "1"` and shows “You're on the list. Thanks!” on the next visit. The module never reads `/interest`, and this repo does not change Firebase rules or data.

## Phase 2

Move each league app into this repo as `/nba`, `/nhl`, `/nfl`, and `/mlb`. Those apps should use the shared assets here and read their data from `/leagues/{id}` paths. Leave the old GitHub Pages repos live until that league’s move has been checked against the old site. Archive links stay on their current sites until someone migrates them on purpose.

## GitHub Pages

1. Open this repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Branch: `main`. Folder: `/` (root). Save.
4. When the deploy finishes, the hub is at `https://michaelrippe.github.io/teamleague/`.

`.nojekyll` is in the root so Pages will not run Jekyll or drop files.

## Custom domain later

1. Add a `CNAME` file at the repo root. One line, the hostname only, for example `league.example.com`.
2. At the DNS host, point that name at GitHub Pages. A subdomain is a `CNAME` record to `michaelrippe.github.io`. An apex domain uses the `A` records GitHub documents: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
3. In **Settings** → **Pages**, enter the custom domain and turn on HTTPS when GitHub offers it.
4. Keep hub assets relative (`assets/styles.css`, not `/teamleague/assets/...` and not a hard-coded host). Add `<meta property="og:url">` and a canonical link once the final hostname is settled. League cards can keep absolute URLs until those apps live in this repo.

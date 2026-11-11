# ATLAS Personal Time v1.8

**English** · [Srpski](README.sr.md)

A personal decimal clock and calendar. One day = 100 hours × 100 minutes ×
100 seconds × 100 hundredths, but the day is still the same 24 conventional
hours. A new hour is **14 min 24 s**, a new minute **8.64 s**, a new second
**0.0864 s**. The year has 13 months of 28 days, plus one extra day.

No accounts, no database, no npm dependencies, no external fonts, no tracking.
Python standard library on the server; plain HTML, CSS and JavaScript modules
in the browser. The interface is available in English and Serbian.

By Marjan Panic · License: [PolyForm Noncommercial 1.0.0](LICENSE): free for
noncommercial use, commercial use needs the author's permission.

## Quick start

Requires Docker Engine and Docker Compose v2 (or just Python 3, see below).

```bash
git clone https://github.com/neoartdoo/ATLAS-Time.git
cd ATLAS-Time
cp .env.example .env     # optional: change port or bind address
bash start.sh
```

Open <http://localhost:6140>. Update later with `git pull && bash start.sh`.

Without Docker: `python3 server.py`, then open <http://localhost:8080>
(use the `PORT` variable for another port).

### Configuration

Set in `.env` (all optional, see `.env.example`):

| Variable | Default | Meaning |
|---|---|---|
| `CLOCK_PORT` | `6140` | Host port |
| `CLOCK_BIND` | `127.0.0.1` | Bind address. `0.0.0.0` exposes the clock to your whole LAN |
| `CLOCK_EMBED_ORIGINS` | empty | Origins allowed to embed `/?embed=1` in an iframe, space separated |

The app has no login. Expose it only on networks you trust. The published image
is `ghcr.io/neoartdoo/atlas-time`, built from version tags (`v*`) by GitHub Actions.

## What it shows

| Route | Purpose |
|---|---|
| `/` | Main clock, conventional comparison, stardate, monthly calendar |
| `/calendar` | All 13 months of a year (0001–9999), jumps of ±1/100/1000 years |
| `/history` | Gregorian / Julian / personal calendar conversion, BCE and year zero, saved events |
| `/analog` | Five-hand dial: four digit hands and a seconds hand |
| `/analog-3` | Three-hand dial: full hours, minutes and seconds |
| `/help` | Complete guide, code map, printing and round-trip diagnostics |

Language: choose English / Srpski on any page. The choice is stored in a
first-party `atlas_lang` cookie for one year; `?lang=en` and `?lang=sr` also work.

## Rules

- **Decimal time:** `052.034.081.009` = 52 hours, 34 minutes, 81 seconds, 9 hundredths
  (each group runs 000–099). The last group changes faster than a screen can draw,
  so some values are skipped. That is display resolution, not a claim of accuracy.
- **Calendar:** the Gregorian year number and 1 January start. Months 1–13 have 28
  days, except month 13 which always has 29 (the *year day*), and month 1 which also
  has 29 in leap years (the *leap day*). The week runs continuously through all days
  with 0001-01-01 anchored to Monday. Date format: `2026.011.001` = year.month.day.
- **Leap rule:** divisible by 4, except centuries unless divisible by 400, applied
  proleptically to all years. This is a mathematical calendar, not a record of what
  any country used at the time.
- **Stardate:** days since 0001-01-01 00:00 UTC plus the decimal time of day, always UTC.
  Example `739896.073.069.073` = `739896.736973` days.
- **Time basis:** fixed UTC+01 by default (every day has 24 h), or fixed UTC+02, UTC,
  or Europe/Berlin (follows daylight saving, so two days a year have 23 or 25 h).
- **History:** astronomical years −9999 to 9999 (year 0 = 1 BCE) or historical
  1–9999 BCE/CE (no year 0). Choose the original calendar; no local reforms are guessed.
- **Synchronisation:** the page starts with the device time, then takes three
  `/api/time` samples, keeps the one with the smallest round trip and corrects by
  half of it, and repeats every 60 s. Between syncs it uses the browser's monotonic
  clock. Accuracy depends on the host clock and network; leap seconds are not
  counted separately from Unix time. This is not an atomic clock.
- **Saved events** live only in the browser (`localStorage`), never on the server.
  Use *Export JSON* on `/history` for backups (format `atlas-history-v1`, max 500 events).

### Keeping the host clock accurate

The app does not set any clock and does not query time servers itself. It shows the
time of the computer that runs the server, so keep that computer synchronised with any
NTP server (for example `pool.ntp.org` or `time.windows.com`):

- **Windows:** the Windows Time service. Check with `w32tm /query /status`, request a new
  sync with `w32tm /resync` (administrator). The clock of the Docker Desktop virtual
  machine can lag after sleep or hibernation; restarting Docker Desktop resynchronises it.
- **Linux:** `timedatectl status` should show the system clock as synchronised
  (`systemd-timesyncd` or `chrony`).

Full explanations, calculations and sources are on the `/help` page.

## Project layout

| Path | Purpose |
|---|---|
| `server.py` | Static file server and the `/api/time` endpoint (standard library only) |
| `web/clock.mjs` | Core maths: leap years, month lengths, decimal time, personal date, time zones |
| `web/stardate.mjs` | Stardate calculation |
| `web/history-core.mjs` | Julian Day Number based date converter |
| `web/analog-core.mjs`, `web/analog3-core.mjs` | Hand angles of the two analog clocks |
| `web/app.mjs`, `year.mjs`, `calendar-ui.mjs` | Main page and calendar views |
| `web/history.mjs`, `analog.mjs`, `analog3.mjs`, `help.mjs` | Page controllers |
| `web/i18n.mjs` | English / Serbian switching |
| `web/*.html`, `web/en/*.html` | Serbian and English pages; edit both when changing text |
| `Dockerfile`, `compose.yaml`, `start.sh` | Container build and start |
| `tests/` | Node and Python tests |

Source files carry comments that explain what each part does.

## Development and tests

```bash
node --test tests/*.test.mjs
python3 tests/server_test.py
```

The tests cover time and calendar arithmetic, historical dates, hand angles,
stardates, language behaviour and the local HTTP routes. GitHub Actions runs them on
every push and pull request. `translations/static-en.json` is a reference list of the
first English translation, not a build step.

## License and credit

Copyright (c) 2026 Marjan Panic. Licensed under the
[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0):
you may use, study, modify and share the software for noncommercial purposes, keeping
the copyright notice and license (the full text is in [LICENSE](LICENSE)). Commercial use
needs separate written permission.

A license protects the code, texts and name; it does not give anyone exclusive rights
over the underlying ideas (decimal time, a 13-month calendar). The decimal-time and
13-month ideas have long histories, and this project is one personal take on them.

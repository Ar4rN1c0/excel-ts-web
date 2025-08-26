# F1 in Schools – Event Scheduler

A complete scheduling system for **multi-day F1 in Schools events**. It generates team schedules, assigns judges, checks conflicts, and produces visual + Excel outputs for organizers. You can run it as a web app during development, or as a packaged desktop tray app.

---

## Features

- 📅 **Multi-day** event scheduling
- 🏎️ Automatic assignment of:
  - Scrutiny
  - Technical & Enterprise Portfolios
  - Verbal Presentations
  - Races (qualifiers)
  - Global events (opening talk, awards, …)
- 👨‍⚖️ **Judge allocation** with concurrency rules
- ⏱️ **Collision-free** time-slot scheduling
- 🧠 Smart windowing & priority handling
- 📊 **Interactive timeline** (views for teams/judges/global)
- 📤 **Export options** for organizers & stakeholders
- 🧪 **Unit tests** for core algorithms (conflicts, windowing, edge cases)
- 🖥️ **Desktop tray app** (Windows/macOS/Linux) that hosts the UI locally

---

## Repository Layout

The repo has two main areas: the **frontend app** (`src/…`) and the **desktop wrapper** (`executable/…`). They are built independently.

### Frontend application (`src/`)
```
src
├── helpers
│   ├── assigners/        # Event & judge assignment logic
│   ├── fileType/         # Parsers/serializers for supported inputs
│   │   ├── excel/
│   │   │   └── files/    # Sample templates / fixtures
│   │   ├── json/
│   │   └── zip/
│   ├── generators/       # Dummy data / seeds for testing
│   ├── math/             # Time windows, collision checks, constraints
│   ├── schedulers/       # Multi-/single-day scheduling engines
│   ├── storage/          # Persistence helpers (local/session)
│   └── validation/       # Schema + guardrails for inputs
├── lib/                  # UI helpers (ARIA labels, validators, utils)
├── styles/               # Global styles (library.css, main.css, …)
├── types/                # Shared types (Equipo, Evento, Juez, Config, …)
└── views/                # All UI components: forms, inputs, tables, pages
    ├── components/
    └── main/
```
### Desktop tray app (`executable/`)
```
executable
├── F1Scheduler.exe       # Built binary (Windows example)
├── _embed/
│   └── dist/             # Mirrored frontend build (copied from ../dist)
│       ├── assets/       # CSS/JS chunks (main-*.js, *.css, …)
│       ├── index.html
│       ├── library.html
│       ├── test.html
│       └── vite.svg
├── go.mod
├── go.sum
├── main.go               # Systray app that serves embedded dist/ via HTTP
├── res/
│   └── app.ico           # Tray icon
└── tools/
    └── syncdist.go       # go:generate helper to mirror ../dist → ./_embed/dist
```
---

## Tech Stack

- **Frontend:** TypeScript, HTML, CSS (bundled with Vite)
- **Desktop wrapper:** Go (`embed`, `net/http`), `systray`
- **Excel I/O:** client-side parsers (see `src/helpers/fileType/excel`)
- **Testing:** your test suite under `/tests`

---

## Inputs

The scheduler accepts event configuration either as **Excel** or via the **Config Form** in the UI.

- **Excel input (`.xlsx`)**  
  - `Configuración` sheet: event parameters, durations, dates  
  - `Equipos` sheet: list of teams, categories  

- **Config Form (in-app)**  
  - Directly enter durations, categories, and events from the browser UI  
  - Supports adding teams manually without Excel  

---

## Outputs

After scheduling, the app can produce multiple types of exports:

- **Excel**
  - 📄 Master schedule (**Gantt-style**)  
  - 📄 Per-judge schedules  
  - 📄 Per-team schedules  

- **Compressed archive**
  - 📦 `.zip` containing all Excel outputs  

- **Data export**
  - 🗂️ `.json` file capturing the complete state  

- **Webpage**
  - 📊 HTML timetable (interactive table view)  

---

## Quick Start

### Option A — Develop the web app

1) **Install deps**
```shell
pnpm i
```

2) **Run dev server**
```shell
pnpm dev
# or
node --run dev
```
3) Open the printed local URL. Edit code in `src/…`; hot-reload will update pages under `views/`.

4) **Run tests**
```shell
pnpm test
# or
node --run test
```
---

### Option B — Build for production (web)

1) **Build**
```shell
pnpm build
# emits ./dist with index.html + assets
```
2) **Serve the static bundle** (any static server)
```shell
npx serve dist
# or your preferred static host
```
---

### Option C — Package & run the desktop tray app

> The tray app embeds the **contents of `../dist`** into `executable/_embed/dist`. Make sure you’ve built the frontend first.

1) **Build frontend**
```shell
pnpm build           # produces ../dist
```
2) **Mirror dist into the executable**
```shell
cd executable
go generate ./...    # runs tools/syncdist.go → copies ../dist → ./_embed/dist
```
3) **Run the tray app**
```shell
go run .             # starts local HTTP server + system tray
```
4) **Build a binary**
```shell
go build -o F1Scheduler .
# Windows example shown above; macOS/Linux work too.
```
When the tray app starts, use the tray menu:
- **Open App** → `index.html`
- **Open Library** → `library.html`
- **Open Test** → `test.html`
- **Quit** gracefully stops the server.

---

## Testing

Run the full test suite:
```shell
pnpm test
# or
node --run test
```
Covers:
- Time-window extraction
- Concurrency checks
- Collision detection
- Multi-day & back-to-back edge cases

---

## Example Duration Config (JSON)
```json
{
  "Duración registro": 5,
  "Duración Escrutinio Entry": 15,
  "Duración Portfolio Técnico Professional": 15,
  "Duración Presentación Verbal Entry": 10
}
```
---

## Troubleshooting

- **The tray app shows a blank page**  
  Ensure you ran `pnpm build` and then `go generate ./...` inside `executable/` so `_embed/dist` isn’t empty.

- **`go generate` fails with “dist folder not found at ../dist”**  
  You’re missing the frontend build. Run `pnpm build` at repo root.

- **Static assets 404**  
  Check that `_embed/dist/assets/*` exists and filenames match the ones referenced by the HTML (Vite content-hashes).

---

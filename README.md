# F1 in Schools – Event Scheduler

This project is a complete scheduling system for organizing and managing **multi-day F1 in Schools events**. It generates team schedules, assigns judges, and produces visual and Excel-based outputs for organizers.

---

## Features

- 📅 Supports **multi-day event scheduling**
- 🏎️ Automatically assigns:
  - Scrutiny
  - Technical and Enterprise Portfolios
  - Verbal Presentations
  - Races (qualifiers)
  - Global events (e.g., opening talks, award ceremonies)
- 👨‍⚖️ Judge allocation with concurrency rules
- ⏱️ Collision-free time-slot scheduling
- 📊 Interactive timeline visualization
- 📤 Excel export for:
  - Master schedule
  - Individual team schedules
  - Judge schedules
- 🧪 Unit-tested core algorithms (e.g. conflict detection, windowing)
- 🧠 Smart time-slot allocation with priority handling

---

## Project Structure

```
src/
│
├── helpers/
│   ├── assigners/       # Logic for assigning events
│   ├── generators/      # Random data generation (teams, judges)
│   ├── math/            # Time window + conflict calculations
│   └── views/           # HTML/Excel output rendering
│
├── types/               # Shared types (Equipo, Evento, Juez, Config, etc.)
├── style.css            # Basic responsive styling for UI
├── main.ts             # Main entry point
└── excel/               # Excel export and input parsing
```

---

## Setup

### 1. Install Dependencies

```bash
pnpm i
```

### 2. Run the Scheduler

You can either run it directly via a static server or bundle it:

```bash
node --run dev
# or
pnpm dev
```

### 3. Import Config from Excel (Optional)

You can upload a `.xlsx` file to load team/event configuration dynamically. Use the included \`dummy-input.xlsx\` generator for testing:

```bash
node scripts/generate.js
```

---

## File: `dummy-input.xlsx`

This contains:

- A `Configuración` sheet (parameters, durations, dates)
- An `Equipos` sheet (list of teams and categories)

You can edit this manually or regenerate it using the script above.

---

## Roles Supported

- Jueces de:
  - Portfolio Técnico
  - Portfolio de Empresa
  - Presentación Verbal
  - Escrutinio
- Personal de Registro

---

## Outputs

After running the script:

- The webpage shows a **visual timeline** of all events.
- Buttons allow exporting:
  - 📄 Master Excel schedule
  - 📄 Team-specific schedules
  - 📄 Judge-specific schedules

---

## Testing

To run tests:

```bash
node --run test
# or
pnpm test
```

Tests cover:
- Time-window extraction
- Concurrency checks
- Collision detection
- Edge cases (multi-day, back-to-back events)

---

## Example Event Duration Config

```json
{
  "Duración registro": 5,
  "Duración Escrutinio Entry": 15,
  "Duración Portfolio Técnico Professional": 15,
  "Duración Presentación Verbal Entry": 10
}
```

---


## 📜 License

MIT

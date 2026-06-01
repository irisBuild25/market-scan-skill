# plugin-market-scan

A portable, self-contained Agent Skill that runs a monthly **AI market intelligence scan** and publishes it as a structured Markdown (`.md`) recap, a newspaper-style HTML (`.html`) page, and a PDF (`.pdf`).

## What it does

Given a trigger like *"run market scan"*, the skill:

1. **Fetches** fresh signals in parallel via web search across product/news, strategy, policy, and security sources (scoped to the past 2 months for a monthly cadence).
2. **Filters** to signals with a real product/PM "so-what" — discarding hype and funding noise.
3. **Saves** a structured markdown recap from the bundled template.
4. **Renders** a newspaper-style HTML from the bundled template.
5. **Exports** a print-ready PDF.

It replies with a single confirmation line; the content lives in the output files.

## Install

Choose one of two ways.

### Option A — As a Claude Code plugin (recommended)

Inside a Claude Code session, add this repo as a marketplace and install the plugin:

```text
/plugin marketplace add irisBuild25/market-scan-skill
/plugin install market-scan-skill@irisbuild-plugins
```

### Option B — As a personal skill (manual clone)

Clone the repo straight into your personal skills folder:

```bash
git clone https://github.com/irisBuild25/market-scan-skill ~/.claude/skills/market-scan-skill
```

Both make the skill available in any project; trigger it by asking for a *"market scan."*

### Install the Node dependencies

The bundled scripts need a few Node packages. From the installed folder:

```bash
npm install
```

- `puppeteer` — HTML→PDF export and JS-heavy page rendering
- `defuddle` + `jsdom` — clean article extraction

If you only want the markdown recap (no PDF), you can skip this; the PDF/scrape steps fail gracefully with a clear message and the rest of the pipeline still runs.

## First run (guided setup)

The very first time you trigger a scan, the skill runs a short one-time setup before doing any work. It walks you through three settings, one at a time — showing you what's currently set and asking whether to keep or change it:

1. **Where to save scans** — an absolute folder path (or accept the `./market-scan/` default).
2. **Sources & time window** — which sites/topics to search and how far back (e.g. weekly vs. monthly).
3. **Relevance filter** — what counts as a signal worth keeping vs. discarding.

Your answers are written back into `SKILL.md`, so **the skill remembers them** — later runs skip setup and go straight to producing the scan. To redo the setup at any time, just say *"reconfigure market scan"* (or edit `SKILL.md` directly).

> Note: this works because the skill can edit its own `SKILL.md`. If you installed it somewhere read-only, it will simply ask each run instead of saving your answers.

## Layout

```
plugin-market-scan/
├── SKILL.md                      # the skill instructions (the entry point)
├── package.json                  # Node dependencies
├── README.md
├── assets/
│   ├── market-scan-recap.md      # markdown recap template
│   └── market-scan-template.html  # HTML newspaper template
└── scripts/
    ├── pdf-export.mjs            # HTML file → PDF
    ├── url-to-pdf.mjs            # URL → PDF (JS-heavy pages)
    └── defuddle.mjs              # URL → clean markdown
```

## Output

Scans are written to `./market-scan/YYYY-MM-DD/` in the current working directory by default:

- `market-signals-YYYY-MM-DD-scan.md` — the recap
- `market-scan-YYYY-MM-DD.html` — the newspaper page
- `market-scan-YYYY-MM-DD.pdf` — the exported PDF

Override the location by telling the assistant where to save.

## Customize your scan

The [first-run setup](#first-run-guided-setup) is the easiest way to lock in your sources, time window, and filter. Beyond that, you can adjust things anytime in two ways:

- **Per run** — just tell the assistant what you want for that scan (e.g. *"run a market scan of the past week focused on AI fintech, and add Ars Technica"*). This doesn't change the saved defaults.
- **Permanently** — say *"reconfigure market scan"*, or edit `SKILL.md` directly. The reference below explains each setting:

- **Time window** — match it to how often you run the scan. Weekly → `past 2 weeks`; monthly → `past 2 months` (default); quarterly → `past 4 months`. Keep roughly one period of overlap so nothing falls through the cracks between runs.
- **Sources** — add, remove, or swap any query line. Use `site:<domain>` to pin a trusted publisher (e.g. `site:arstechnica.com`, `site:stratechery.com`), or drop the `site:` filter for an open-web query on a topic you care about (e.g. `AI coding agents developer tools past 2 months [current year]`).
- **Focus** — retarget the topics to your domain — e.g. swap the generic PM-tools line for your vertical (`AI fintech compliance past 2 months [current year]`, `AI healthcare diagnostics past 2 months [current year]`).
- **Relevance filter** — the keep/discard criteria under **Filter** in `SKILL.md` are defaults too. Add, remove, or reword them to match what counts as a signal for you (e.g. add "pricing or packaging change by a major AI vendor", or tighten it to your industry) and adjust what gets discarded.

## Usage of the scripts directly

```bash
node scripts/defuddle.mjs "https://example.com/article"          # clean markdown to stdout
node scripts/url-to-pdf.mjs "https://x.com/user/status/123" out.pdf
node scripts/pdf-export.mjs page.html page.pdf
```

## License

MIT — see [LICENSE](LICENSE).

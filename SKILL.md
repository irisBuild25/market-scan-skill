---
name: plugin-market-scan
description: 'Run a monthly AI market intelligence scan: fetch fresh signals across news/policy/security sources, save a structured markdown recap, render a newspaper-style HTML, and export a PDF. Use when: market scan, scan the market, what''s new in tech, get me the news, run market scan, publish last scan, turn last scan into newspaper.'
---

# Market Scan (portable plugin edition)

Produce a PM-grade market intelligence scan as files, not chat. The job is to surface signals with a genuine product/PM "so-what" — not to dump every AI headline. Run the full pipeline (fetch → recap → HTML → PDF) and reply with a single confirmation line.

This is the **portable, self-contained** edition: all paths are relative to the plugin directory, all scripts resolve their dependencies from a local `node_modules`, and URL fetching is bundled (no external skill dependency). It is safe to publish and run in any workspace.

## Setup (one-time)

From the plugin directory, install the Node dependencies used by the bundled scripts:

```bash
npm install
```

This installs `puppeteer` (PDF export + JS-heavy page rendering), `defuddle`, and `jsdom` (article extraction). If you only need the markdown recap and not the PDF, you can skip this — the PDF/scrape steps will report a clear error and the rest of the pipeline still works.

## Conventions

- `PLUGIN_DIR` = the directory containing this `SKILL.md`. Substitute the real absolute path when running commands.
- `OUTPUT_DIR` = where scans are written. **Status: NOT CONFIGURED** (fallback: `./market-scan/` in the current working directory).

## First-run setup

**Setup status: NOT CONFIGURED**

If the status above reads **NOT CONFIGURED**, this is the first run. Before running the pipeline, walk the user through the three settings below **one at a time**. For each: **first display the current value exactly as it appears in this file** (quote the actual lines, don't summarize), then ask *"This is what's currently set — keep it, or customize?"*. If they customize, apply the change by **editing this `SKILL.md` in place**. Then move to the next.

1. **Output location** — display the current `OUTPUT_DIR` line from Conventions, then ask for an absolute folder path (or keep the `<cwd>/market-scan/` fallback). Write the chosen path into that line and mark it `Status: CONFIGURED`.
2. **Sources & time window** — display the current query list under **Step 1 — Fetch** verbatim, then ask if they want to add/remove/swap sources or change the time window (e.g. `past 2 weeks` / `past 2 months` / `past 4 months`). Rewrite the query list with their choices.
3. **Relevance filter** — display the current keep/discard criteria under **Step 1 → Filter** verbatim, then ask what counts as a signal for them. Rewrite the keep and discard bullets with their choices.

When all three are done, **flip the Setup status above to CONFIGURED** so future runs skip this section. (The user can redo this anytime by saying *"reconfigure market scan"* — reset the status to NOT CONFIGURED — or by editing the relevant lines directly.)

On every later run the status is **CONFIGURED**: skip this section and run the pipeline straight through using the saved settings.

## Triggers

| Command | Action |
|---|---|
| "market scan" / "scan the market" / "what's new in tech" / "get me the news" / "run market scan" | Full pipeline: fetch + save markdown recap + generate HTML + export PDF |
| "publish last scan" / "turn last scan into newspaper" / "publish news" | Skip fetch — use the most recent `OUTPUT_DIR/YYYY-MM-DD/market-signals-YYYY-MM-DD-scan.md` → generate HTML + PDF only |

## Step 1 — Fetch 

Use WebSearch in parallel — do NOT use WebFetch as the primary fetch (blocked on these sites). This scan runs monthly, so scope every query to the **past 2 months** (one-month overlap buffer ensures nothing is missed between runs):
- `AI product news site:techcrunch.com past 2 months [current year]`
- `Hacker News AI product discussion past 2 months [current year]`

### Reading full article content (bundled fallback chain)

When search snippets aren't enough, fetch the full article using the bundled scripts. Try each step in order; stop at the first that returns usable content:

1. **Defuddle** — clean markdown extraction:
   ```bash
   node "PLUGIN_DIR/scripts/defuddle.mjs" <url>
   ```
   Non-empty output + exit 0 → use it. Otherwise continue.
2. **WebFetch** — call the WebFetch tool with: "Extract the full article text and return it as clean markdown." Meaningful content → use it. Otherwise continue.
3. **Puppeteer PDF** — for JS-heavy pages (e.g. X/Twitter):
   ```bash
   node "PLUGIN_DIR/scripts/url-to-pdf.mjs" <url> "OUTPUT_DIR/_scrape/<slug>.pdf"
   ```
   On `PDF saved →`, read the PDF and extract the text. If all three fail, report the URL and move on.

### Filter — keep if at least one:
- New AI model, feature, or capability released
- Competitor or major tech company ships an AI product move

Discard: funding rounds with no product angle, general hype, unrelated verticals.

## Step 2 — Save Markdown Recap

Save to: `OUTPUT_DIR/YYYY-MM-DD/market-signals-YYYY-MM-DD-scan.md` (create the date folder if it doesn't exist).

Use `PLUGIN_DIR/assets/market-scan-recap.md` as structure. Fill in all sections:
- Macro Theme + why it matters
- Top Signals (5–7): headline, source with hyperlink, date, PM lens, relevance rating (🔴🟡⚪), dig-deeper prompt
- Competitive Radar table
- Emerging Hypothesis (if 2+ signals converge)
- AI Tools Spotted
- Open Questions
- Actions

Append to monthly log `OUTPUT_DIR/market-signals-YYYY-MM-log.md` (create if missing):
```
## Scan: YYYY-MM-DD
[macro theme]

[signal bullets]
```

## Step 3 — Generate HTML

Use `PLUGIN_DIR/assets/market-scan-template.html` as the base. Fill every `<!-- DATA: ... -->` placeholder with content from the markdown recap. See **DATA mapping** below.

Signal range: 5–9. Omit unused signal card blocks. Cards 08 and 09 are optional — include only if signal count warrants it.

Save HTML to: `OUTPUT_DIR/YYYY-MM-DD/market-scan-YYYY-MM-DD.html`

### DATA mapping

| Placeholder | Value |
|---|---|
| `scan_date` | e.g. "February 22, 2026" |
| `hero_eyebrow` | e.g. "Monthly Market Scan · 7 Signals" |
| `hero_headline` | Macro theme — punchy, bold (rewrite if needed for impact) |
| `hero_deck` | Why it matters (2 sentences) |
| `scan_date_long` | e.g. "Sunday, February 22, 2026" |
| `signal_count` | Integer count of signals |
| `sources_list` | e.g. "TechCrunch · The Verge · Reuters · a16z · HN" — list actual sources used |
| `signal_N_headline` | Signal headline |
| `signal_N_source_name` | Publication name |
| `signal_N_source_url` | Direct article URL |
| `signal_N_date` | e.g. "Feb 22, 2026" |
| `signal_N_relevance` | CSS class: `high` / `medium` / `watch` |
| `signal_N_relevance_label` | "High" / "Medium" / "Watch" |
| `signal_N_type` | CSS class: `product` / `policy` / `security` / `strategy` / `research` |
| `signal_N_type_label` | "Product" / "Policy" / "Security" / "Strategy" / "Research" |
| `signal_N_what` | 1–2 sentence factual summary |
| `signal_N_pm_lens` | PM so-what (2–3 sentences) |
| `signal_N_dig_deeper` | Follow-up question string |
| `hypothesis_pattern` | Named pattern |
| `hypothesis_confidence` | CSS class: `high` / `medium` / `low` |
| `hypothesis_confidence_label` | "High" / "Medium" / "Low" |
| `hypothesis_if_true_1` | First implication sentence |
| `hypothesis_if_true_2` | Second implication sentence |
| `hypothesis_next_step` | Next step action |
| `hypothesis_dig_deeper` | Pressure-test question |
| `radar_rows` | One `.radar-row` div per competitor |
| `tools_rows` | One `.tool-row` div per tool |
| `questions_list` | One `.question-item` div per question |
| `actions_list` | One `.action-item` div per action |
| `footer_scan_ref` | e.g. "AI Intel · Market Scan · 2026-02-22" |

## Step 4 — Export PDF

```bash
node "PLUGIN_DIR/scripts/pdf-export.mjs" \
  "OUTPUT_DIR/YYYY-MM-DD/market-scan-YYYY-MM-DD.html" \
  "OUTPUT_DIR/YYYY-MM-DD/market-scan-YYYY-MM-DD.pdf"
```

## Confirmation Messages

Do not print the full recap in chat — confirmation line only.

**Full scan (default):** `Published → OUTPUT_DIR/YYYY-MM-DD/ · market-signals-YYYY-MM-DD-scan.md + market-scan-YYYY-MM-DD.html + .pdf · [N] signals`

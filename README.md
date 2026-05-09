# RIVIT — Manufacturing Operations Intelligence (Demo Dashboard)

**RIVIT** is a **Manufacturing Operations Intelligence Platform** demonstration. It is branded in-app as **RIVIT · Vectrum Manufacturing** (`src/constants/branding.js`): a credible **heavy equipment / truck-style** manufacturing narrative (inventory, sequencing, shortages, receipts, tariffs, shipments, planners, buyers).

This README is written for **two readers**: (1) people evaluating or extending the product, and (2) **AI coding assistants** (Cursor, Claude, Gemini, etc.) that need a faithful map of scope, data flow, and intent—without inventing features that are not in the repo.

**TL;DR (non-technical):** RIVIT is a manufacturing operations command center that helps every role—from operator to management—see the same supply and production risks in one place, act faster, and avoid line disruptions. Today it supports realistic demos plus CSV/Excel data uploads, and the next step is native two-way ERP integration.

---

## 0. Quick reference (especially for AI assistants)

Use this block as **ground truth** when answering “what does this app do?” or “where is X implemented?”

| Topic | Fact |
|--------|------|
| **Runtime shape** | Single-page **React** app (`create-react-app`). No separate backend service ships *inside this repository*. |
| **Default data** | Seeded from **`src/data/sampleData.js`** (+ helpers) via **`DashboardDataProvider`** (`src/context/DashboardDataContext.jsx`). |
| **User-provided data** | **CSV and Excel (XLSX)** uploads in **Data Sync** replace/merge demo datasets: **`src/modules/DataSyncModule.js`**, parsing via **`src/utils/dataSyncParse.js`** (SheetJS / `xlsx` in the dependency tree). |
| **Persistence** | **Browser `localStorage`** for demo continuity and patches—keys in **`src/constants/demoStorageKeys.js`**. Not a server database. |
| **ERP integration (live)** | **Not implemented in this codebase today.** No OAuth-to-SAP or production two-way sync yet. |
| **ERP integration (intent)** | **Planned / next step:** **bidirectional** connection to a customer’s ERP (in development roadmap). |
| **“AI Agents” in UI** | **Scripted** demo agents in **`AIAgentsModule.js`** + related playbook/notification copy—not autonomous LLM orchestration of ERP. |
| **Role-based UX** | **`src/config/roleNavConfig.js`** (`ROLES`) filters sidebar; **`src/components/RoleLogin.js`** selects persona. |

---

This document is intentionally **long**. **Humans:** read **§1–§3**, then **§7–§8**. **AI tools:** read **§0**, **§1** (data path), **§8**, then skim `App.js`, `roleNavConfig.js`, `DashboardDataContext.jsx`, `DataSyncModule.js`, `sampleData.js`.

---

## 1. What this product is — and what it is not

### What it is

- A **single front-end SPA** (`create-react-app` / React 19) that shows how **different plant roles** could share **one coherent picture** of supply, demand, and execution risk.
- A **conversation starter for GTM**, internal alignment, design reviews, and pilot scoping. It is not a full MES/APS/WMS replacement without further integration work.
- A **supply-chain-informed UX**: escalation language, production terminology, and workflow emphasis reflect **real plant behavior** rather than generic dashboard categories.
- A system that already supports **bringing your own tabular data**: operators can load **CSV/XLSX** through the **Data Sync** module so the UI runs against **their** inventory, suppliers, shipments, orders, and forecast columns (within the app’s expected shapes)—not only the baked-in Vectrum sample.

### How data gets into the app today (read this carefully)

1. **Bundled demo narrative** — `sampleData.js` and related files supply the default “Vectrum” story.
2. **File upload** — **Data Sync** accepts **CSV/XLSX** for datasets such as finished goods, components, suppliers, open orders, shipments, and demand forecast (see the upload-target definitions near the top of `DataSyncModule.js`). Files are **parsed in the browser** and applied to application state.
3. **Session persistence** — selective state and user/demo adjustments persist in **`localStorage`** (see `demoStorageKeys.js`), so refreshes and demos do not always snap back to pure JSON seeds.

So: the app **does** have a real **data-ingestion** path (files you export from ERP, planning tools, or spreadsheets). What it **does not yet include** is a **live, always-on, two-way ERP connector** in this repository—that is **explicitly a next-step roadmap item**.

### Roadmap: ERP and two-way integration

The **intended end state** is **bidirectional integration** with a customer’s ERP (read status/planning/inventory signals in; push approved actions or confirmations back where appropriate). That layer is **not built here yet**; this repo focuses on the **role-based experience** and **file-based and local persistence** so pilots can run **without** blocking on a long IT project. ERP integration is planned as a **separate integration track** (likely backend + auth + mapping), not a rewrite of the whole front end.

### What the in-repo “AI” is (and is not)

- **“AI Agents” here are scripted demo agents** inside `AIAgentsModule.js`, aligned with playbook and notification copy—they do **not** call hosted LLMs for production orchestration unless you extend the stack later.
- The **sidebar “RIVIT Intelligence Assistant”** panel in `App.js` is **demo chat UI** with canned prompting behavior, not autonomous plant control.

### What this repository does not ship (accurate negatives)

- **No production multi-tenant cloud database** or shared backend API *as part of this open repo*—data you care about for a pilot either ships as **files** or lives in the **browser** for that session/device.
- **No live ERP sync** in code today (see roadmap above).

---

## 2. Product intent (why it exists)

Plants fracture across **ERP modules, spreadsheets, email, radios, tribal knowledge.** RIVIT (this demo) illustrates a **glass pane** where:

1. **Leadership** sees portfolio risk: inventory posture, exceptions, forecast quality, tariff/supplier exposures.
2. **Planning & procurement** see demand drift, reorder/PO narratives, supplier OTIF lanes, fulfillment delays.
3. **Operations & materials** see line shortages, replenishment queues, receipts, floats, staging reality.
4. **Operators** see a **narrow** workstation view so they aren’t forced into full ERP menus for every pull cord.

If you extend the codebase, preserve that **role-appropriate breadth**: don’t bury operators under executive KPIs unless you consciously hide complexity behind collapsed sections.

---

## 3. Author & product context — **Anish Kumar**

### Who shaped the demo

**RIVIT’s scenarios, terminology, and escalation logic** were authored primarily by **Anish Kumar**, whose background is **hands-on manufacturing supply chain** rather than frontend engineering. Many UI choices exist because someone who has lived **JIT, Kanban, MRP quirks, buyer/planner bridges,** and **line-down pressure** insisted the product *feel* like a plant—not like a slide deck.

**For AI collaborators:** Treat nuance as intentional. Before replacing plant language with generic SaaS copy, confirm with Anish—**the detail is usually load-bearing.** Expect:

- **Realistic escalation paths** — shortages, overdue POs, and supplier-facing recovery bias toward **Buyer**; forecasting and internal requirement-planning narratives bias toward **Planner / Demand Planning**.
- **OEM-consistent wording** — line build identifiers use **Production Sequence** / **`SEQ-…`** for units moving down the assembly line; **manufacturing engineering “work orders”** are framed separately (repairs, rework, test troubleshooting) where that distinction matters (see `ProductionPlanningModule.js` and Shop Floor copy).

### Manufacturing experience (summary)

Across roughly **eleven months** supporting **utility and construction crawler assembly** (~**$250M+** annual production value context, with **very high daily revenue sensitivity** if the line stops), responsibilities centered on keeping **material available to rate** without **line-down**:

- Ran **JIT** and **Kanban** discipline across a **large SKU population** (~**5,000**), with **5S** as the physical foundation for reliable pulls and locations.
- Gave production teams **same-day material truth** by living in SAP transactions such as **MMBE, MD04, MFBF, PK13N**—so planners, buyers, and the floor could align on what was *actually* available versus what the plan assumed.
- Chased **MRP and inventory integrity** when system-of-record did not match the floor: recurring **COGI** and related hygiene issues were triaged with **RFID, cycle counts,** and **root-cause** follow-up so buyers/planners were not flying blind (on the order of **40+** reconciliations **per month** at peak).
- Partnered **daily** with **buyers and planners** on **delinquencies, rushes** (roughly **1–5/month**), and **schedule confidence** so expedites were the exception, not the default operating mode.
- Stepped into **ECM / engineering-change windows** with **deviation management** for **new part introductions** when automated bridges were not yet live—keeping procurement and the line **continuous** during transitions.
- Balanced **production protection** with **field / customer-service emergencies** (allocation trade-offs, dock coordination, returnable rack awareness) so service needs did not silently **stop the line**.

### Process automation (how the same problems show up in data)

Separately, Anish built **Databricks** workflows (**SQL / PySpark**) that:

- Ingested **SAP inventory outputs** and modeled **short-horizon critical exposure** (e.g. **five-day** coverage framing) for a **5,000-SKU** scope.
- Replaced a standing **~5 hours/week** manual consolidation with **action-oriented signals** (alerts meant to be *decision-ready*, not another raw dump).

That work is **not wired into this React repo**; it informed how RIVIT thinks about **alert quality** and **cross-functional visibility**.

### Why RIVIT exists (motivation, neutral tone)

Time at **John Deere** highlighted a common pattern in **large-scale manufacturing**: teams deliver excellent results, but **visibility and coordination** still depend heavily on **ERP transactions, spreadsheets, meetings, and heroics**—especially when modules do not tell one continuous story for every role.

Later exposure to **[Curator](https://www.curator.to)**—an **AI operations workspace** oriented around **chat, cross-system context, and operators** (commerce / brand ops today)—reinforced the idea that **execution teams deserve a single place** to see risk, reason about it, and act **without** tab-hopping all day.

**RIVIT** is Anish’s **manufacturing-flavored expression** of that idea: a **role-aware command surface** for **inventory, planning, floor, procurement, and leadership** in one demo—grounded in how plants actually escalate, not in how generic BI imagines them.

---


## 4. Technical stack

| Piece | Detail |
|--------|--------|
| Framework | React 19, `react-scripts` 5 (`package.json`) |
| Charts | Recharts |
| Globe / maps | `react-globe.gl`, Three.js (supplier / geopolitical demos) |
| Exports | CSV & Excel helpers (`src/utils/exportUtils.js`, `xlsx` family) |
| PDF | Browser print hooks + printable React views (`src/components/ExecutivePdfPrintView.js`, `GenericPdfPrintView.js`) |

---

## 5. Repository layout (map for developers & AI assistants)

```
src/
├── App.js                    # Shell: role login, sidebar, notifications, AI panel, MRP modal, routing to modules
├── App.css                   # Primary styling
├── dashboardPrint.css       # Print / PDF-facing styles where used
├── config/
│   ├── navRegistry.js        # Sidebar label registry (Executive, Suppliers, Inventory group, …)
│   └── roleNavConfig.js      # ROLES: which nav IDs each persona sees + default landing screen
├── context/
│   ├── DashboardDataContext.jsx   # Central demo state: seed data + patches + history
│   └── ExportRegistrationContext.jsx
├── components/               # Logo, RoleLogin, modals, PDF views, Sync strip, Communications hub…
├── modules/                  # One main UI surface per operational area (see §6)
├── data/
│   ├── sampleData.js         # Primary synthetic dataset exports (SKU, suppliers, shipments, agentAlerts…)
│   ├── demoCleanSample.js    # Alternate “cleaner” storyline + swaps for neutralized components
│   ├── demoCleanSample helpers, *_builder.js seeds for movements/history as needed
│   └── ...
├── utils/
│   ├── exportUtils.js        # CSV/XLSX export wiring & row builders per view
│   ├── escalationContactHint.js # Shared “Suggested next step: notify Buyer vs Planner…” strings
│   ├── executiveSummaryMetrics.js # Shared exec KPI / exception rollup
│   ├── agenticPlaybook.js, attentionQueue.js, …
│   └── demoScenarioBoot.js
└── constants/
    ├── branding.js          # Product strings
    └── demoStorageKeys.js   # localStorage keys & reset helpers
```

---

## 6. Major modules (`src/modules/`) — capabilities at a glance

Routing is driven by **`active`** sidebar state and role filtering in **`App.js`** + **`roleNavConfig.js`**. Inventory uses **nested children** (`inventory-fg`, `inventory-components`, `inventory-parts`).

| Approximate user lens | Module file | What it communicates |
|------------------------|-------------|----------------------|
| Executive / steering | `ExecutiveCommandCenterModule.js` | KPIs, coverage strip, exceptions feed feeding same `agentAlerts` as notifications |
| Order-level promise vs supply | `OrderBankModule.js` | ATP / backlog / promise-style storytelling |
| Customer-specific orders | `CustomerOrdersModule.js` | Order drill-down, delay drafts, escalation to planning visibility |
| FG / Class A catalog views | `InventoryModule.js` | Uses context data; FG vs Components vs expandable flows per nav id |
| Deep parts hub | `PartsInventoryModule.js` | Search, adjustments, replenishment queue (ties to MC + operator storyline) |
| Supplier health | `SupplierModule.js` | OTIF lanes, geography, narrative risk |
| Trade / tariff exposure | `TradeRiskModule.js` | Exposure dollars, policy-style framing |
| Inbound shipments | `FulfillmentModule.js` | Shipment statuses, lanes |
| Demand shape | `DemandForecastModule.js` | Forecast curves, bias language |
| Plan / replenish PO view | `SupplyPlanningModule.js` | Planning narrative; ties to demo “MRP Nightly” in header |
| PO tracker | `PurchaseOrdersModule.js` | Purchase order spreadsheet-style UX |
| Build plan + BOM expansion | `ProductionPlanningModule.js` | Weekly **production sequences**, engineering alerts |
| Line reality | `ShopFloorModule.js` | Lines, floats, shortages, SEQ ids, escalation modals |
| Operator | `MyWorkStationModule.js` | Station KPIs, part requests feeding MC queue (`RIVIT_MC_REPLENISHMENT_QUEUE_KEY`) |
| Receiving dock | `ReceivingModule.js` | Receipt confirmations, discrepancy flavor |
| Cross-cutting exceptions | `AttentionQueueModule.js` | Unified queue building on agent + shipment + supplier signals (`utils/attentionQueue.js`) |
| Action proposals | `AgenticPlaybookModule.js` | “Playbook” rows from `utils/agenticPlaybook.js` |
| Synthetic agents UI | `AIAgentsModule.js` | Per-agent alerts, Take Action menus, planner/buyer contact modals |
| Data plumbing story | `DataSyncModule.js` | Sync UX; reset demo clears keys in `demoStorageKeys.js` |
| Humans + supplier contacts | `ContactsModule.js` | Internal roster + supplier contacts; featured buyer note for escalation realism |

Supporting UX: **`GlobalCommunicationsHub.js`**, **`EmailComposeModal`** (demo compose flows), **`SyncHealthStrip`**, **`RoleLogin.js`** (persona picker).

---

## 7. Personas & navigation (`src/config/roleNavConfig.js`)

Each **`ROLES[id].segments`** list controls what appears in the sidebar. **`defaultActive`** is the first screen after login.

| `id` | Label | Typical default |
|------|--------|----------------|
| `admin` | Admin | Executive (full nav) |
| `management` | Management | Executive |
| `buyer-planner` | Buyer / Planner | Order Bank |
| `material-coordinator` | Material Coordinator | Parts Inventory |
| `warehouse` | Warehouse / Receiving | Receiving |
| `shop-supervisor` | Shop Floor Supervisor | Shop Floor |
| `operator` | Operator | My Work Station |
| `mfg-engineer` | Manufacturing Engineer | Production Planning |

**Role-aware notification filtering** (some roles only see certain categories) lives in **`App.js`** (`allowedCategoriesForRole`).

---

## 8. Data & persistence model

### Primary seed data

**`src/data/sampleData.js`** exports arrays/objects consumed by **`DashboardDataProvider`** (`DashboardDataContext.jsx`), including:

- `skuData`, `componentData`, `classBCData` (where used)
- `supplierData`, `shipmentData`, `customerOrderData`, `orderHistory`
- `agentAlerts` (feeds Exec feed, playbook construction, seeded notifications)
- `contactDirectory`

### CSV / Excel ingestion (not “ERP,” but real customer data paths)

Users can upload **CSV or XLSX** via **`src/modules/DataSyncModule.js`**:

- Parsing pipeline: **`src/utils/dataSyncParse.js`** (`parseFileToMatrix`, column mapping helpers).
- The UI exposes dataset types such as finished goods inventory, components, supplier list, open orders/order bank, shipments, and demand forecast (see the upload-target list at the top of `DataSyncModule.js`).
- This is **intentionally** how a pilot team brings **exports from SAP or any spreadsheet** into RIVIT **without** waiting for API integration.

**AI assistants:** when the user says “connect ERP,” distinguish **(A) file-based ingestion already in the app** from **(B) live two-way ERP sync (roadmap, not in repo).**

### “Clean vs crisis” demo scenario

Bootstrap reads scenario preference (**`src/utils/demoScenarioBoot.js`**). **`demoCleanSample.js`** can swap or neutralize certain rows (`agentAlertsClean`, shortage seeds, neutralized CMP rows) while **`neutralizeComponentDataForCleanSample`** adjusts component narratives.

### `localStorage` keys (demo continuity)

Declared in **`src/constants/demoStorageKeys.js`**. Notable examples:

| Key purpose | Constant |
|-------------|----------|
| Fine-grained SKU / component patches merged on load | `RIVIT_ADJUSTMENTS_KEY` |
| Purchase-order demo state | `RIVIT_POS_KEY` |
| Dismissed synthetic agent banners | `RIVIT_DISMISSED_AGENT_ALERTS_KEY` |
| Operator station + MC replenishment hydration | `RIVIT_MY_WORK_STATION_STATE_KEY`, `RIVIT_MC_REPLENISHMENT_QUEUE_KEY` |
| Demo UI density preference | `SC_UI_DENSITY_KEY` |

**Reset:** `clearDemoLocalStorage()` / Data Sync flows remove these keys so the storyline returns to seeded JSON.

---

## 9. Domain rules implemented in software (don’t regress casually)

These are deliberate product semantics embedded in UX and helpers:

### Production Sequence vs Manufacturing Work Order

- **Production Sequence** (**`SEQ-…`**) tracks **units moving through the assembly line** in Shop Floor / Production Planning / seeded alerts where updated.
- **Work order** language in planning module copy is framed for **engineering repair / test troubleshooting**, distinct from sequencing production.

When adding new storyline text, stay consistent unless the product owner changes the rule.

### Escalation & contact semantics

**`src/utils/escalationContactHint.js`** centralizes footer strings for notifications and Executive exception hints:

- Forecast / Demand → Planner / Demand Planning alignment.
- Pure MRP-complete style messages → Planner / requirement planning framing.
- Supply shortage, PO overdue, inbound material risk → Buyer bias.
- Fulfillment/carrier jams → Logistics first; Buyer only when supplier commits block material.

`AIAgentsModule.js` separates **Contact Buyer** vs **Contact Planner** by agent kind and alert text patterns; Shop Floor shortages route to Buyer for supply recovery.

---

## 10. Exports & print surfaces

- **CSV / Excel**: `npm run`-safe client exports via **`src/utils/exportUtils.js`** wired from **`App.js`** export menu (`exportForActiveView`).
- **PDF-style printing**: Dedicated React print trees (Executive summary, Supplier scorecard-ish flows, Purchase Orders PDF hook, Trade Risk…) triggered from header buttons when the active route matches guard logic in **`App.js`**.

---

## 11. Adding features safely

1. Prefer extending **`DashboardDataContext`** getters/setters vs prop-drilling fifteen components.
2. When adding nav items: update **`navRegistry.js`** labels if globally new AND **`roleNavConfig.js`** per persona AND route switch in **`App.js`** (`ActiveView` mapping).
3. If you invent new alert prose, reuse **`primaryEscalationHintFromAgentAlert`** / **`appendEscalationHint`** so Notifications + Exec stay aligned.
4. If you mutate persistent demo artifacts, register keys inside **`demoStorageKeys.js`** and **`DEMO_RESET_STORAGE_KEYS`** unless intentionally exempt.

---

## 12. Local development & CRA scripts

```bash
cd supply-chain-ai-dashboard
npm install
npm start          # http://localhost:3000 — development server + HMR
npm test           # Jest RTL harness (baseline CRA)
npm run build      # production bundle to ./build
```

CRA reference: https://create-react-app.dev/

---

## 13. Security, privacy & licensing stance

**Bundled demo data** are fictional (Vectrum narrative). Once teams use **CSV/XLSX upload**, treated files may contain **real commercially sensitive rows**—do not commit customer exports to git, and treat `localStorage` on shared machines accordingly.

---

## 14. Changelog-worthy recent product decisions (maintainer note)

- README clarifies **file ingestion (CSV/XLSX)** vs **live ERP**; **bidirectional ERP integration** documented as **post–paid-customer roadmap**, not current repo capability.
- Contact escalation hierarchy aligned toward **Buyer** for shortages / PO / supplier recovery; Planner retained where forecast/MRP-queue semantics apply.
- Line identifier terminology migrated from **`Work Order` / `WO-`** toward **`Production Sequence` / `SEQ-`** across modules, seeded alerts, and movement-history narrative strings.

**Maintainers:** append bullets here when behavior or positioning changes—LLM sessions often read README instead of git history.

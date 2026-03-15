# Finance Tracker

A local web application for reviewing personal bank statements, categorising transactions, and visualising monthly spending. Runs entirely on your machine — no cloud, no subscriptions.

---

## Quick Start

**Prerequisites:** Node.js 20+, npm 10+

```bash
# 1. First-time setup — checks Node version, installs deps, creates runtime dirs
make setup

# 2. Start both servers with hot reload
make dev
#    Frontend → http://localhost:3000
#    Backend  → http://localhost:3001
```

Run `make` with no arguments to see all available targets.

---

## Make Targets

| Target | Description |
|---|---|
| `make setup` | Check Node ≥ 20, install deps, create runtime dirs, copy `.env.example` |
| `make install` | Install all npm workspace dependencies |
| `make dev` | Start frontend + backend in parallel (hot reload) |
| `make dev-frontend` | Frontend only |
| `make dev-backend` | Backend only |
| `make typecheck` | `tsc --noEmit` on both workspaces |
| `make lint` | ESLint on both workspaces |
| `make test` | Vitest on both workspaces |
| `make build` | Production build (both workspaces) |
| `make start` | Start the production backend server |
| `make clean` | Remove all `dist/` and `node_modules/` directories |

---

## Project Structure

```
finance-tracker/
├── frontend/                   # React 18 + Vite 5 + Ant Design 6.x
│   └── src/
│       ├── components/
│       │   ├── analytics/      # CategoryPieChart
│       │   ├── common/         # AppLayout, EmptyDashboard, ProcessingBanner
│       │   ├── transactions/   # TransactionTable, MonthSelector
│       │   └── upload/         # UploadZone, UploadHistory
│       ├── hooks/              # useTransactions, useUpload, useCategories
│       ├── pages/              # DashboardPage, UploadsPage
│       ├── services/           # apiClient, queryClient, *Service
│       ├── store/              # filterStore, uploadStore (Zustand)
│       ├── styles/             # global.css, theme.ts (Ant Design tokens)
│       ├── types/              # transaction.ts, upload.ts, api.ts
│       └── utils/              # formatters.ts, constants.ts
│
├── backend/                    # Node.js 20 + Fastify 4.x
│   └── src/
│       ├── config/             # app.ts (zod-validated env config)
│       ├── database/
│       │   ├── connection.ts   # SQLite singleton (WAL mode)
│       │   ├── migrations/     # 001_initial.ts — schema + seed categories
│       │   └── models/         # types.ts
│       ├── middleware/         # errorHandler.ts
│       ├── processors/         # pdfProcessor, csvProcessor, excelProcessor
│       ├── routes/             # uploads, transactions, categories, analytics
│       ├── services/           # uploadService, transactionService, aiService
│       ├── utils/              # fileUtils.ts (hashing, date overlap)
│       └── server.ts           # Fastify entry point
│
├── database/                   # SQLite .db files at runtime (gitignored)
├── uploads/                    # Uploaded statement files at runtime (gitignored)
├── logs/                       # Application logs at runtime (gitignored)
├── docs/                       # Architecture, PRD, UI design spec
├── Makefile
└── package.json                # npm workspaces root
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Ant Design 6.x |
| Charts | @ant-design/charts v2.x |
| State | Zustand 5, TanStack Query v5 |
| Routing | React Router v6 |
| Backend | Node.js 20 LTS, Fastify 4.x, TypeScript 5 |
| Database | SQLite via Better-SQLite3 (WAL mode) |
| File parsing | pdf-parse + Tesseract.js, Papa Parse, XLSX |
| Validation | Zod |
| AI | OpenAI SDK (optional — set `OPENAI_API_KEY` in `backend/.env`) |

---

## Environment Configuration

Copy the example file and edit as needed:

```bash
cp backend/.env.example backend/.env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend port |
| `FRONTEND_PORT` | `3000` | Frontend port (used for CORS) |
| `DATABASE_PATH` | `../database/finance.db` | SQLite file path |
| `UPLOADS_PATH` | `../uploads` | Uploaded files directory |
| `OPENAI_API_KEY` | _(unset)_ | Optional — enables AI categorisation |

---

## Documentation

- [Product Requirements](docs/product-requirements.md)
- [System Architecture](docs/system-architecture.md)
- [UI Design Spec](docs/ui-design-spec.md)

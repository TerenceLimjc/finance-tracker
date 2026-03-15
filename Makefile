.DEFAULT_GOAL := help

# ─── Variables ────────────────────────────────────────────────────────────────
NODE_MIN_VERSION := 20
NODE_VERSION     := $(shell node -e "process.stdout.write(process.versions.node.split('.')[0])" 2>/dev/null)

# ─── Help ─────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  Finance Tracker — available targets"
	@echo ""
	@echo "  Setup"
	@echo "    make setup          Check Node version, install deps, create runtime dirs"
	@echo "    make install        Install all npm workspace dependencies"
	@echo ""
	@echo "  Development"
	@echo "    make dev            Start frontend + backend in parallel (hot reload)"
	@echo "    make dev-frontend   Start frontend only  (http://localhost:3000)"
	@echo "    make dev-backend    Start backend only   (http://localhost:3001)"
	@echo ""
	@echo "  Quality"
	@echo "    make typecheck      Run tsc --noEmit on both workspaces"
	@echo "    make lint           Run ESLint on both workspaces"
	@echo "    make test           Run Vitest on both workspaces"
	@echo ""
	@echo "  Build"
	@echo "    make build          Build both workspaces for production"
	@echo "    make start          Start the production backend server"
	@echo ""
	@echo "  Maintenance"
	@echo "    make clean          Remove all dist/ and node_modules/ directories"
	@echo ""

# ─── Setup ────────────────────────────────────────────────────────────────────
.PHONY: setup
setup: _check-node install _init-dirs
	@echo ""
	@echo "  Setup complete. Run 'make dev' to start."
	@echo ""

.PHONY: _check-node
_check-node:
	@if [ -z "$(NODE_VERSION)" ]; then \
		echo "ERROR: Node.js not found. Install Node.js $(NODE_MIN_VERSION)+ from https://nodejs.org"; \
		exit 1; \
	fi
	@if [ "$(NODE_VERSION)" -lt "$(NODE_MIN_VERSION)" ]; then \
		echo "ERROR: Node.js $(NODE_MIN_VERSION)+ required. Found: $$(node -v)"; \
		exit 1; \
	fi
	@echo "Node.js $$(node -v) OK"

.PHONY: _init-dirs
_init-dirs:
	@mkdir -p database uploads logs
	@echo "Runtime directories ready (database/, uploads/, logs/)"
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "Created backend/.env from .env.example"; \
	fi

# ─── Install ──────────────────────────────────────────────────────────────────
.PHONY: install
install:
	npm install

# ─── Development ──────────────────────────────────────────────────────────────
.PHONY: dev
dev:
	npm run dev

.PHONY: dev-frontend
dev-frontend:
	npm run dev --workspace=frontend

.PHONY: dev-backend
dev-backend:
	npm run dev --workspace=backend

# ─── Quality ──────────────────────────────────────────────────────────────────
.PHONY: typecheck
typecheck:
	npm run typecheck --workspace=frontend
	npm run typecheck --workspace=backend

.PHONY: lint
lint:
	npm run lint --workspace=frontend
	npm run lint --workspace=backend

.PHONY: test
test:
	npm run test --workspace=frontend
	npm run test --workspace=backend

# ─── Build ────────────────────────────────────────────────────────────────────
.PHONY: build
build:
	npm run build

.PHONY: start
start:
	npm run start

# ─── Maintenance ──────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	rm -rf frontend/dist backend/dist
	rm -rf node_modules frontend/node_modules backend/node_modules
	@echo "Clean complete."

.PHONY: start dev build migrate setup

# Start production server (builds first)
start: build
	PORT=3001 npx next start

# Initial setup: install deps, run migrations
setup:
	@npm install --prefer-offline --no-audit 2>/dev/null || npm install
	@npx drizzle-kit push 2>/dev/null || true

# Run dev server
dev:
	npx next dev

# Production build
build:
	npx next build

# Run migrations
migrate:
	npx drizzle-kit push

# Generate migration files
generate:
	npx drizzle-kit generate

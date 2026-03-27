SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help install setup infra-up infra-down infra-logs db-generate db-migrate db-migrate-dev \
	api-dev admin-dev worker-dev dev lint test typecheck build clean check

help:
	@echo "Comandos disponiveis:"
	@echo "  make install         - instala dependencias do monorepo"
	@echo "  make setup           - instala dependencias, gera Prisma Client e aplica migrations"
	@echo "  make infra-up        - sobe Redis, RabbitMQ, Prometheus e Grafana"
	@echo "  make infra-down      - derruba a infraestrutura Docker"
	@echo "  make infra-logs      - mostra logs do docker compose"
	@echo "  make db-generate     - gera o Prisma Client do api"
	@echo "  make db-migrate      - aplica migrations no Postgres configurado"
	@echo "  make db-migrate-dev  - executa prisma migrate dev no api"
	@echo "  make api-dev         - sobe apenas o api em modo desenvolvimento"
	@echo "  make admin-dev       - sobe apenas o admin em modo desenvolvimento"
	@echo "  make worker-dev      - sobe apenas o worker em modo desenvolvimento"
	@echo "  make dev             - sobe todos os apps do monorepo em paralelo"
	@echo "  make lint            - roda ESLint"
	@echo "  make test            - roda os testes"
	@echo "  make typecheck       - roda o TypeScript sem emitir build"
	@echo "  make build           - gera build de todos os workspaces"
	@echo "  make clean           - limpa artefatos de build"
	@echo "  make check           - roda lint, typecheck, test e build"

install:
	pnpm install

setup: install db-generate db-migrate

infra-up:
	docker compose up -d

infra-down:
	docker compose down

infra-logs:
	docker compose logs -f

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-migrate-dev:
	pnpm db:migrate:dev

api-dev:
	pnpm --filter @projeto-alfa/api dev

admin-dev:
	pnpm --filter @projeto-alfa/admin dev

worker-dev:
	pnpm --filter @projeto-alfa/worker dev

dev:
	pnpm dev

lint:
	pnpm lint

test:
	pnpm test

typecheck:
	pnpm typecheck

build:
	pnpm build

clean:
	pnpm clean

check: lint typecheck test build

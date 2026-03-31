# Projeto Alfa

Monorepo inicial da plataforma com tres servicos principais:

- `apps/api`: API principal e fronteira publica do produto
- `apps/admin`: painel administrativo e ferramentas operacionais
- `apps/worker`: jobs assíncronos, integrações e processamento de fundo

## Estrutura

```text
apps/
  admin/
  api/
  worker/
packages/
  config/
```

## Subir localmente

Fluxo recomendado:

```bash
make infra-up
make setup
make api-dev
```

Se quiser subir toda a stack de apps do monorepo:

```bash
make dev
```

Pre-requisitos:

- `pnpm`
- `Docker` com `docker compose`
- `Postgres` local

Banco esperado no ambiente local:

- host: `127.0.0.1`
- port: `5432`
- database: `projeto_alfa`
- user: `postgres`
- password: `teste123`

Se o banco ainda nao existir:

```bash
PGPASSWORD=teste123 createdb -h 127.0.0.1 -U postgres projeto_alfa
```

## Makefile

Comandos principais:

- `make help`: lista todos os comandos do projeto
- `make install`: instala dependencias do monorepo
- `make setup`: instala dependencias, gera Prisma Client e aplica migrations
- `make infra-up`: sobe Redis, RabbitMQ, Prometheus e Grafana
- `make infra-down`: derruba a infraestrutura Docker
- `make infra-logs`: acompanha logs do `docker compose`
- `make db-generate`: gera o Prisma Client do `api`
- `make db-migrate`: aplica migrations no Postgres configurado
- `make db-migrate-dev`: executa `prisma migrate dev` no `api`
- `make api-dev`: sobe apenas o `api`
- `make admin-dev`: sobe apenas o `admin`
- `make worker-dev`: sobe apenas o `worker`
- `make dev`: sobe todos os apps do monorepo
- `make lint`: roda ESLint
- `make test`: roda os testes
- `make typecheck`: roda TypeScript sem emitir build
- `make build`: gera build de todos os workspaces
- `make clean`: limpa artefatos de build
- `make check`: roda `lint`, `typecheck`, `test` e `build`

## Scripts pnpm

Scripts da raiz:

- `pnpm dev`: sobe os servicos em modo desenvolvimento
- `pnpm build`: gera build de todos os workspaces
- `pnpm lint`: roda ESLint nos workspaces
- `pnpm test`: roda a suite de testes do monorepo
- `pnpm typecheck`: roda TypeScript em todos os workspaces
- `pnpm clean`: limpa artefatos de build
- `pnpm db:generate`: gera o Prisma Client do `api`
- `pnpm db:migrate`: aplica migrations pendentes do `api`
- `pnpm db:migrate:dev`: executa `prisma migrate dev` no `api`

Scripts por app:

- `pnpm --filter @projeto-alfa/api dev`
- `pnpm --filter @projeto-alfa/api build`
- `pnpm --filter @projeto-alfa/api lint`
- `pnpm --filter @projeto-alfa/api test`
- `pnpm --filter @projeto-alfa/api typecheck`
- `pnpm --filter @projeto-alfa/api clean`
- `pnpm --filter @projeto-alfa/api db:generate`
- `pnpm --filter @projeto-alfa/api db:migrate`
- `pnpm --filter @projeto-alfa/api db:migrate:dev`
- `pnpm --filter @projeto-alfa/admin dev`
- `pnpm --filter @projeto-alfa/admin build`
- `pnpm --filter @projeto-alfa/admin lint`
- `pnpm --filter @projeto-alfa/admin test`
- `pnpm --filter @projeto-alfa/admin typecheck`
- `pnpm --filter @projeto-alfa/admin clean`
- `pnpm --filter @projeto-alfa/worker dev`
- `pnpm --filter @projeto-alfa/worker build`
- `pnpm --filter @projeto-alfa/worker lint`
- `pnpm --filter @projeto-alfa/worker test`
- `pnpm --filter @projeto-alfa/worker typecheck`
- `pnpm --filter @projeto-alfa/worker clean`

## Infra local

O `Postgres` fica fora do `docker-compose`, assumindo instalacao local no host.

Servicos de apoio disponiveis via Compose:

- `Redis`: cache, locks e pub/sub
- `RabbitMQ`: filas e mensageria assíncrona
- `Prometheus`: coleta de metricas
- `Grafana`: visualizacao inicial de observabilidade

Subir a infraestrutura:

```bash
make infra-up
```

Parar a infraestrutura:

```bash
make infra-down
```

Painéis locais:

- `RabbitMQ`: http://localhost:15672 (`admin` / `admin`)
- `Prometheus`: http://localhost:9090
- `Grafana`: http://localhost:3001 (`admin` / `admin`)

Arquivos de ambiente de referencia:

- raiz: [.env.example](/home/tachian/work/projeto-alfa/.env.example)
- `api`: [apps/api/.env.example](/home/tachian/work/projeto-alfa/apps/api/.env.example)
- `admin`: [apps/admin/.env.example](/home/tachian/work/projeto-alfa/apps/admin/.env.example)
- `worker`: [apps/worker/.env.example](/home/tachian/work/projeto-alfa/apps/worker/.env.example)

Arquivos `.env` locais criados:

- raiz: [.env](/home/tachian/work/projeto-alfa/.env)
- `api`: [apps/api/.env](/home/tachian/work/projeto-alfa/apps/api/.env)
- `admin`: [apps/admin/.env](/home/tachian/work/projeto-alfa/apps/admin/.env)
- `worker`: [apps/worker/.env](/home/tachian/work/projeto-alfa/apps/worker/.env)

Endpoints para apps locais:

- `Postgres`: `postgres://postgres:teste123@127.0.0.1:5432/projeto_alfa`
- `Redis`: `redis://localhost:6379`
- `RabbitMQ`: `amqp://admin:admin@localhost:5672`
- `Prometheus`: `http://localhost:9090`
- `Grafana`: `http://localhost:3001`

## Validacao

Checagem rapida da stack:

```bash
make check
```

Subir so o `api` depois do setup:

```bash
make api-dev
```

Verificar o healthcheck:

```bash
curl http://127.0.0.1:4000/
curl http://127.0.0.1:4000/health/ready
```

## Postman

Collection pronta para importacao:

- [projeto-alfa.postman_collection.json](/home/tachian/work/projeto-alfa/postman/projeto-alfa.postman_collection.json)

Chamadas disponiveis na collection:

- `GET /`
- `GET /health/live`
- `GET /health/ready`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /markets`
- `GET /markets/:marketUuid`
- `GET /markets/:marketUuid/book`
- `POST /orders`
- `GET /orders`
- `POST /orders/:orderUuid/cancel`
- `POST /payments/deposits`
- `GET /payments/deposits`
- `POST /payments/withdrawals`
- `GET /payments/withdrawals`
- `GET /wallet/balance`
- `GET /wallet/entries`
- `GET /admin/markets`
- `GET /admin/markets/:marketUuid`
- `POST /admin/markets`
- `PATCH /admin/markets/:marketUuid`
- `DELETE /admin/markets/:marketUuid`

Para `POST /payments/deposits` e `POST /payments/withdrawals`, envie o header `Idempotency-Key` quando quiser garantir que retries nao criem pagamentos duplicados.

O endpoint `GET /markets` aceita filtros opcionais por:

- `status`
- `category`
- `closeAtFrom`
- `closeAtTo`

Exemplo:

```text
GET /markets?status=open&category=macro&closeAtFrom=2026-06-01T00:00:00.000Z&closeAtTo=2026-06-30T23:59:59.000Z
```

As ordens do MVP aceitam apenas:

- `side`: `buy` ou `sell`
- `outcome`: `YES` ou `NO`
- `orderType`: `limit`
- `price`: inteiro entre `1` e `99`
- `quantity`: inteiro maior que `0`

## CI/CD

GitHub Actions configurado em:

- [ci.yml](/home/tachian/work/projeto-alfa/.github/workflows/ci.yml): lint, typecheck, testes, migrations e build
- [cd.yml](/home/tachian/work/projeto-alfa/.github/workflows/cd.yml): empacota artefatos de `api`, `admin` e `worker` para entrega

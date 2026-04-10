# Projeto Alfa

Monorepo inicial da plataforma com tres servicos principais:

- `apps/api`: API principal e fronteira publica do produto
- `apps/admin`: painel administrativo e ferramentas operacionais
- `apps/web`: portal do usuario comum para cadastro, mercados, ordens e portfolio
- `apps/worker`: jobs assíncronos, integrações e processamento de fundo

## Estrutura

```text
apps/
  admin/
  api/
  web/
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

Para trabalhar com o painel administrativo:

```bash
make api-dev
make admin-dev
```

Depois acesse `http://localhost:3000/login`.

Para trabalhar com o portal do usuario comum:

```bash
make api-dev
make web-dev
```

Depois acesse `http://localhost:3002/`.

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
- `make web-dev`: sobe apenas o portal `web`
- `make worker-dev`: sobe apenas o `worker`
- `make dev`: sobe todos os apps do monorepo
- `make lint`: roda ESLint
- `make test`: roda os testes
- `make load-test`: executa teste de carga basico do `api`
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
- `pnpm load:test`: executa o teste de carga basico do `api`
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
- `pnpm --filter @projeto-alfa/api load:test`
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
- `pnpm --filter @projeto-alfa/web dev`
- `pnpm --filter @projeto-alfa/web build`
- `pnpm --filter @projeto-alfa/web lint`
- `pnpm --filter @projeto-alfa/web test`
- `pnpm --filter @projeto-alfa/web typecheck`
- `pnpm --filter @projeto-alfa/web clean`
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
- `API metrics`: http://localhost:4000/metrics

Arquivos de ambiente de referencia:

- raiz: [.env.example](/home/tachian/work/projeto-alfa/.env.example)
- `api`: [apps/api/.env.example](/home/tachian/work/projeto-alfa/apps/api/.env.example)
- `admin`: [apps/admin/.env.example](/home/tachian/work/projeto-alfa/apps/admin/.env.example)
- `web`: [apps/web/.env.example](/home/tachian/work/projeto-alfa/apps/web/.env.example)
- `worker`: [apps/worker/.env.example](/home/tachian/work/projeto-alfa/apps/worker/.env.example)

Arquivos `.env` locais criados:

- raiz: [.env](/home/tachian/work/projeto-alfa/.env)
- `api`: [apps/api/.env](/home/tachian/work/projeto-alfa/apps/api/.env)
- `admin`: [apps/admin/.env](/home/tachian/work/projeto-alfa/apps/admin/.env)
- `web`: [apps/web/.env](/home/tachian/work/projeto-alfa/apps/web/.env)
- `worker`: [apps/worker/.env](/home/tachian/work/projeto-alfa/apps/worker/.env)

Autenticacao atual do `admin`:

- `POST /auth/login` para iniciar sessao
- `GET /auth/me` para validar a sessao nas paginas protegidas
- `POST /auth/refresh` para renovar a sessao quando o access token expirar
- o `admin` nao cria uma API paralela de autenticacao; ele apenas faz proxy desses endpoints existentes do `api`
- o painel usa sessao no navegador e nao exige colar JWT manualmente
- rotas protegidas do `admin` redirecionam para `/login` quando nao houver sessao valida
- usuarios autenticados sem `role=admin` veem um estado de `Acesso restrito`, com acoes para sair ou trocar de conta

Autenticacao atual do `web`:

- `POST /auth/register` para criar conta com `name`, `email`, `phone` e `password`
- `POST /auth/login` para iniciar sessao do usuario comum
- `GET /auth/me` para validar a sessao nas rotas protegidas
- `POST /auth/refresh` para renovar a sessao automaticamente
- o `web` usa sessao local no navegador e reaproveita os mesmos endpoints de auth do `api`
- rotas protegidas do `web` preservam `returnTo` ao redirecionar para `/login`
- depois do login, o portal volta o usuario para a pagina originalmente solicitada quando houver `returnTo`

Configuracoes relevantes do `api` para KYC/AML:

- `KYC_PROVIDER=mock`
- `KYC_MOCK_DEFAULT_STATUS=approved`

Endpoints para apps locais:

- `Postgres`: `postgres://postgres:teste123@127.0.0.1:5432/projeto_alfa`
- `Redis`: `redis://localhost:6379`
- `RabbitMQ`: `amqp://admin:admin@localhost:5672`
- `Prometheus`: `http://localhost:9090`
- `Grafana`: `http://localhost:3001`
- `Web portal`: `http://localhost:3002`

## Validacao

Checagem rapida da stack:

```bash
make check
```

Subir so o `api` depois do setup:

```bash
make api-dev
```

Subir o `admin`:

```bash
make admin-dev
```

Subir o portal `web`:

```bash
make web-dev
```

Verificar o healthcheck:

```bash
curl http://127.0.0.1:4000/
curl http://127.0.0.1:4000/health/ready
curl http://127.0.0.1:4000/metrics
```

## Fluxo do Admin

Onboarding recomendado:

1. suba `api` e `admin`
2. abra `http://localhost:3000/login`
3. entre com email e senha de um usuario existente no `api`
4. o `admin` usa `POST /auth/login` para criar a sessao
5. o dashboard e a pagina de mercado usam `GET /auth/me` para validar identidade e `role`
6. quando o access token expira, o painel tenta renovar com `POST /auth/refresh`
7. se o refresh falhar, a sessao local e limpa e o usuario volta para `/login`

Areas do painel:

- `Dashboard`: ponto de entrada com atalhos para as areas operacionais
- `Mercados`: CRUD administrativo, detalhe do contrato, resolucao e settlement
- `Trading`: envio de ordens, filtros, cancelamento e acompanhamento operacional
- `Portfolio`: posicoes, PnL consolidado e historico de liquidacoes

Fluxo operacional atual do `admin`:

1. abrir um mercado em `Mercados`
2. usar o atalho `Nova ordem neste mercado` ou `Ver ordens deste mercado`
3. enviar a ordem em `Trading > Nova ordem`
4. acompanhar a ordem em `Trading > Ordens`
5. consultar exposicao em `Portfolio > Posicoes`
6. consultar consolidado em `Portfolio > PnL`
7. acompanhar settlements em `Portfolio > Liquidacoes`

Comportamentos importantes:

- o painel nao usa mais fluxo manual de colar token
- o cabecalho mostra email, role e status da conta autenticada
- o botao `Sair` limpa a sessao local e redireciona para `/login`
- a opcao `Trocar conta` encerra a sessao atual e leva o usuario de volta ao login para autenticar com outro perfil
- se a conta nao tiver `role=admin`, o painel mostra `Acesso restrito` em vez de erro generico `403`
- as paginas protegidas usam a mesma camada de sessao para bootstrap, refresh e autorizacao
- a tela `Trading > Nova ordem` aceita `marketUuid` por query string e tambem por seletor de mercados abertos
- a tela `Trading > Ordens` mostra resumo operacional, filtros ativos e feedback depois de criar ou cancelar ordens
- a tela `Portfolio > Posicoes` aceita filtro por `marketUuid` e linka de volta para a ficha do mercado
- a tela `Portfolio > PnL` muda o destaque do card principal conforme o valor total da carteira
- a tela `Portfolio > Liquidacoes` resume vitorias, derrotas e payout agregado no topo

## Fluxo do Portal

Onboarding recomendado:

1. suba `api` e `web`
2. abra `http://localhost:3002/register`
3. crie uma conta com `nome`, `email`, `telefone` e `senha`
4. depois do cadastro, o portal inicia a sessao do usuario
5. o login reutiliza `POST /auth/login`, `GET /auth/me` e `POST /auth/refresh`
6. rotas protegidas redirecionam para `/login` com `returnTo` quando a sessao estiver ausente
7. quando o access token expira, o portal tenta renovar a sessao automaticamente

Areas do portal:

- `Home`: apresentacao do produto e ponto de entrada do usuario comum
- `Mercados`: catalogo publico e detalhe do contrato com book e trades recentes
- `Ordens`: trilha autenticada para listar e cancelar ordens do usuario
- `Portfolio`: posicoes, PnL e historico de liquidacoes
- `Minha conta`: manutencao cadastral do perfil

Fluxo operacional atual do `web`:

1. criar conta ou entrar no portal
2. explorar mercados em `Mercados`
3. abrir um contrato em `Mercados > Detalhe`
4. enviar ordem diretamente na pagina do mercado
5. acompanhar ordens em `Ordens`
6. consultar exposicao em `Portfolio > Posicoes`
7. consultar resultado consolidado em `Portfolio > PnL`
8. consultar settlements em `Portfolio > Liquidacoes`
9. atualizar nome, email e telefone em `Minha conta`

Comportamentos importantes do portal:

- o cadastro valida `nome`, `email`, `telefone` e `senha` no cliente antes de chamar a API
- a pagina de mercado valida `preco` e `quantidade` antes de enviar ordem
- o envio de ordem fica bloqueado quando o mercado nao estiver em status `open`
- a tela `Ordens` valida filtros de `marketUuid` e `limit` antes de consultar a API
- a tela `Portfolio > Posicoes` resume quantidade de posicoes, mercados, maior exposicao e PnL total
- a tela `Portfolio > PnL` destaca o card principal conforme positivo, negativo ou neutro
- a tela `Portfolio > Liquidacoes` resume quantidade, vitorias, derrotas e payout total
- o botao `Sair` limpa a sessao local e redireciona para `/login`
- o portal possui cobertura e2e da jornada `cadastro -> login -> perfil -> mercado -> ordem -> portfolio`

Canal realtime do `api`:

- `ws://127.0.0.1:4000/realtime`

Observabilidade e reconciliacao:

- `GET /metrics`: metricas Prometheus da API
- `GET /admin/reconciliation/report`: relatorio operacional de reconciliacao
- Prometheus agora carrega regras em [alerts.yml](/home/tachian/work/projeto-alfa/infra/prometheus/alerts.yml)
- O Prometheus local raspa a API em `host.docker.internal:4000`

Controles de seguranca basicos implementados:

- rotas `/admin/*` exigem usuario autenticado com `role=admin`
- respostas da API enviam `x-content-type-options: nosniff`
- respostas da API enviam `x-frame-options: DENY`
- respostas da API enviam `referrer-policy: no-referrer`
- respostas da API enviam `x-robots-tag: noindex, nofollow`

Teste de carga basico:

```bash
make load-test
```

Ou, com parametrizacao:

```bash
LOAD_TEST_URL=http://127.0.0.1:4000 \
LOAD_TEST_PATH=/health/ready \
LOAD_TEST_CONCURRENCY=20 \
LOAD_TEST_REQUESTS=500 \
pnpm load:test
```

Variaveis suportadas:

- `LOAD_TEST_URL`
- `LOAD_TEST_PATH`
- `LOAD_TEST_CONCURRENCY`
- `LOAD_TEST_REQUESTS`
- `LOAD_TEST_TIMEOUT_MS`

Depois de conectar, envie comandos JSON como:

```json
{ "action": "subscribe", "channel": "market:<marketUuid>:book" }
```

ou

```json
{ "action": "subscribe", "channel": "market:<marketUuid>:trades" }
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
- `POST /kyc/submissions`
- `GET /kyc/submissions/latest`
- `GET /kyc/requirements`
- `GET /markets`
- `GET /markets/:marketUuid`
- `GET /markets/:marketUuid/book`
- `GET /markets/:marketUuid/trades`
- `POST /orders`
- `GET /orders`
- `POST /orders/:orderUuid/cancel`
- `POST /payments/deposits`
- `GET /payments/deposits`
- `POST /payments/withdrawals`
- `GET /payments/withdrawals`
- `GET /wallet/balance`
- `GET /wallet/entries`
- `GET /portfolio/positions`
- `GET /portfolio/pnl`
- `GET /portfolio/settlements`
- `GET /admin/markets`
- `GET /admin/markets/:marketUuid`
- `POST /admin/markets`
- `PATCH /admin/markets/:marketUuid`
- `DELETE /admin/markets/:marketUuid`
- `GET /admin/markets/:marketUuid/resolutions`
- `POST /admin/markets/:marketUuid/resolutions`
- `GET /admin/markets/:marketUuid/settlement-runs`
- `POST /admin/markets/:marketUuid/settlement-runs`
- `PATCH /admin/settlement-runs/:settlementRunUuid`
- `POST /admin/settlement-runs/:settlementRunUuid/execute`
- `GET /admin/audit-logs`
- `GET /admin/reconciliation/report`

Para `POST /payments/deposits` e `POST /payments/withdrawals`, envie o header `Idempotency-Key` quando quiser garantir que retries nao criem pagamentos duplicados.

Para simular respostas do provedor KYC mock:

- documento terminando em `999`: `rejected` com AML `flagged`
- documento terminando em `111`: `manual_review`
- qualquer outro final: usa `KYC_MOCK_DEFAULT_STATUS`

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

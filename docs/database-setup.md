# Database Setup

Este guia prepara o PostgreSQL local do backend E-Engineer para testes de login,
dashboard e fluxo inicial com dados realistas.

## 1. Subir PostgreSQL

```bash
docker compose up -d postgres
```

O `docker-compose.yml` usa, por padrao:

```env
POSTGRES_DB=e_engineer
POSTGRES_USER=e_engineer
POSTGRES_PASSWORD=e_engineer
POSTGRES_PORT=5432
```

Os dados ficam persistidos no volume Docker `e-engineer-backend_postgres_data`
ou nome equivalente gerado pelo Compose.

## 2. Configurar `.env`

Um `.env` local foi criado para desenvolvimento e esta ignorado pelo git.
Se precisar recriar manualmente:

```env
NODE_ENV=development
PORT=3000
APP_PORT=3000

POSTGRES_DB=e_engineer
POSTGRES_USER=e_engineer
POSTGRES_PASSWORD=e_engineer
POSTGRES_PORT=5432

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=e_engineer
DB_PASSWORD=e_engineer
DB_DATABASE=e_engineer
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_MIGRATIONS_RUN=false

JWT_SECRET=local-development-secret-with-at-least-32-characters
JWT_EXPIRES_IN=1d
```

Nao use segredo real em ambiente local compartilhado.

## 3. Rodar migrations

```bash
npm run db:migration:run
```

As migrations criam:

- `users`
- `organizations`
- `memberships`
- `projects`
- `project_templates`
- `template_deliverables`
- `deliverables`
- `documents`
- `document_versions`
- `reviews`
- `activity_logs`

O projeto usa `synchronize=false`; alteracoes de banco devem passar por
migrations explicitas.

## 4. Rodar seed

```bash
npm run db:seed
```

O seed e idempotente e pode ser executado mais de uma vez.

Usuario de teste:

```txt
Email: admin@engflow.local
Senha: 123456
Organizacao: Engenharia Horizonte Ltda
Papel: owner
```

A senha e gravada com bcrypt. Ela e inserida diretamente pelo seed para manter
a credencial curta de teste, mesmo que a regra de criacao de usuario exija senha
mais forte.

## 5. Rodar backend

```bash
npm run start:dev
```

Teste de login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@engflow.local","password":"123456"}'
```

O retorno contem o JWT e o `organizationId` que sera usado nas rotas protegidas.

## 6. Reset local

Para reverter a ultima migration, reaplicar e semear:

```bash
npm run db:reset
```

Se o banco estiver muito fora de sincronia, recrie o volume local:

```bash
docker compose down -v
docker compose up -d postgres
npm run db:migration:run
npm run db:seed
```

## 7. Estado dos endpoints

Os dados fake ja existem no banco para:

- dashboard
- projetos
- templates
- entregaveis
- documentos e versoes
- revisoes
- ultimas atividades

Nem todos os endpoints dessas telas existem ainda. Neste corte, os dados foram
preparados no banco sem criar controllers artificiais fora do escopo. As proximas
tasks devem expor consultas tenant-aware para dashboard, listagem de projetos,
detalhe de projeto, entregaveis, documentos, revisoes e activity log.

## Troubleshooting

Se `npm run db:migration:run` nao conectar, confira se o container esta saudavel:

```bash
docker compose ps
```

Se a porta `5432` ja estiver ocupada, altere `POSTGRES_PORT` e `DB_PORT` no
`.env`, ou pare o outro PostgreSQL local.

Se o login retornar 401 apos semear, rode novamente:

```bash
npm run db:seed
```

Se a aplicacao reclamar de env faltante, compare seu `.env` com `.env.example`.

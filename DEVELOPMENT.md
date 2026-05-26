# 🚀 E-Engineer Backend - Guia de Desenvolvimento

Este documento explica como configurar e trabalhar com o backend do e-Engineer localmente.

---

## 📋 Pré-requisitos

- **Node.js** >= 24.x
- **Docker** e **Docker Compose**
- **PostgreSQL** 17 (geralmente via Docker)

---

## 🏃 Quick Start (5 minutos)

### 1. Clonar e Instalar Dependências

```bash
git clone <repo>
cd e-engineer-backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Editar `.env` conforme necessário (geralmente os defaults funcionam para desenvolvimento):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=e_engineer
DB_PASSWORD=e_engineer
DB_DATABASE=e_engineer
```

### 3. Subir Infraestrutura (Docker)

```bash
npm run docker:up
```

Isso sobe o PostgreSQL e cria as redes/volumes necessários.

Verificar status:

```bash
npm run docker:logs
```

### 4. Resetar Banco de Dados com Seed

```bash
npm run db:fresh
```

Este comando:
- ❌ Destrói o banco de dados anterior
- ✅ Cria banco novo
- 🚀 Roda todas as migrations
- 🌱 Popula seed (dados iniciais)

### 5. Iniciar Servidor em Modo Desenvolvimento

```bash
npm run start:dev
```

Servidor rodando em `http://localhost:3000`

---

## 📚 Comandos Disponíveis

### Desenvolvimento

```bash
npm run start:dev        # Inicia servidor com hot-reload
npm run start:debug      # Inicia com debugger ativo
npm run build            # Build para produção
npm run start:prod       # Inicia versão producão
```

### Banco de Dados

```bash
npm run db:fresh         # 🔥 RESET TOTAL: dropa, recria, migra, seed
npm run db:migration:run # Roda migrations pendentes
npm run db:migration:revert # Reverte última migration
npm run db:migration:generate # Gera migration automática
npm run db:seed          # Roda seed apenas
```

### Docker

```bash
npm run docker:up        # Inicia containers
npm run docker:down      # Para containers
npm run docker:logs      # Ver logs do PostgreSQL
```

### Testes

```bash
npm run test             # Roda testes uma vez
npm run test:watch       # Testes com auto-reload
npm run test:cov         # Testes com coverage
npm run test:e2e         # Testes end-to-end
```

### Código

```bash
npm run lint             # Executa eslint + correções
npm run format           # Formata código com prettier
```

---

## 🗄️ Estrutura de Banco de Dados

Migrations são versionadas e rodadas em sequência:

```
src/database/migrations/
├── 1716746400000-create-tenants.ts
├── 1716746500000-create-users.ts
└── 1716746600000-create-organizations.ts
```

Ao criar nova migration:

```bash
npm run db:migration:generate src/database/migrations/YourMigrationName
```

---

## 🌱 Seed Data

Seed está em `src/database/seeds/seed.ts`. Aqui você popula dados iniciais para desenvolvimento:

- Organizações de teste
- Usuários de teste
- Projetos de exemplo
- Templates padrão

Quando rodar `npm run db:fresh`, o seed é executado automaticamente.

---

## 🐛 Troubleshooting

### Erro: "Banco de dados já existe"

Solução: Destruir tudo e recriar

```bash
npm run docker:down
npm run docker:up
npm run db:fresh
```

### Erro: "Conexão recusada no PostgreSQL"

1. Verificar se Docker está rodando:
   ```bash
   docker ps
   ```

2. Verificar logs do PostgreSQL:
   ```bash
   npm run docker:logs
   ```

3. Aguardar container ficar healthy (pode levar 10-20 segundos)

### Erro de "senha muito curta" nas migrations

Se aumentou tamanho da senha no data-source.ts, rode `db:fresh` para recriar:

```bash
npm run db:fresh
```

---

## 🏗️ Estrutura do Projeto

```
src/
├── shared/
│   ├── domain/           # Value objects compartilhados
│   ├── application/      # DTOs, ports, interfaces
│   └── infrastructure/   # TypeORM config, decorators, middleware
├── modules/
│   ├── identity/         # Users, Organizations, Roles
│   ├── projects/         # Engineering projects
│   ├── templates/        # Project templates
│   ├── deliverables/     # Technical deliverables
│   └── documents/        # Document versioning
└── database/
    ├── migrations/       # TypeORM migrations
    └── seeds/            # Seed data
```

---

## 🔐 Multi-Tenancy

O sistema é **multi-tenant desde o design**.

- Toda entidade está vinculada a `organizationId`
- Contexto do tenant é injetado via middleware
- Nenhuma query ignora o tenant

Ao chamar a API, o header `X-Organization-Id` é obrigatório:

```bash
curl http://localhost:3000/projects \
  -H "X-Organization-Id: <uuid-da-organizacao>"
```

---

## 📖 Próximos Passos

1. Ler [COMECE-AQUI.md](./COMECE-AQUI.md) para entender a visão
2. Ler [README.md](./README.md) para documentação geral
3. Ver [CODEX.md](./CODEX.md) para decisões arquiteturais

---

## 🤝 Contribuindo

Antes de fazer commit:

1. Rodar testes: `npm run test`
2. Verificar linting: `npm run lint`
3. Formatar código: `npm run format`

---

## ❓ Dúvidas?

Consultar:
- [CODEX.md](./CODEX.md) — Decisões arquiteturais
- [COMECE-AQUI.md](./COMECE-AQUI.md) — Visão do produto

# 🔐 SESSÃO CODEX: Autenticação Backend

**Status:** ▶️ EM ANDAMENTO  
**Data de Início:** 25 de maio de 2026  
**Objetivo:** Implementar Identity module com autenticação JWT completa  
**Prioridade:** 🔴 CRÍTICA para MVP  
**Tempo Estimado:** 3-5 dias

---

## 📖 Preparação da Sessão

### Documentos Já Lidos e Entendidos ✅
- [../master.md](../master.md) — Guia de princípios + arquitetura
- [./codex.md](./codex.md) — Decisões arquiteturais anteriores
- [../ANALISE-MVP-2026-05-25.md](../ANALISE-MVP-2026-05-25.md) — Análise estratégica MVP
- [./AUTH.md](./AUTH.md) — Prompt estruturado desta sessão

### Stack Confirmado
- **Backend:** NestJS 11 + TypeORM 0.3 + PostgreSQL + Docker
- **Node:** 22.x (obrigatório para build/testes)
- **Pattern:** Clean Architecture + DDD (já aplicado em Projects)
- **Multi-tenancy:** organizationId obrigatório em toda entidade

---

## 🎯 Objetivo Esta Sessão

Implementar autenticação funcional para que:

```
USER LOGIN FLOW:
┌─────────────────┐
│ POST /auth/login│
│ email, password │
└────────┬────────┘
         │
    ┌────▼──────────────────────────┐
    │ 1. Validar credenciais        │
    │ 2. Gerar JWT token            │
    │ 3. Retornar token + user data │
    └────┬───────────────────────────┘
         │
┌────────▼─────────────────┐
│ GET /projects            │
│ Authorization: Bearer... │
└────────┬────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Token validado                 │
    │ UserId e OrgId extraídos       │
    │ Projetos da org retornados     │
    └────────────────────────────────┘
```

---

## 📋 O Que Implementar (Passo a Passo)

### Fase 1: Foundation (Domain Layer)

#### Dia 1: Domain Entities e Value Objects

**Criar:**
- `src/modules/identity/domain/entities/user.ts` — User aggregate root
- `src/modules/identity/domain/entities/user.spec.ts` — Testes
- `src/modules/identity/domain/value-objects/email.ts` — Email value object
- `src/modules/identity/domain/value-objects/password.ts` — Password com bcrypt
- `src/modules/identity/domain/errors/` — Todos os erros

**Instalar dependência:**
```bash
npm install bcrypt @types/bcrypt
```

**Validar:**
```bash
npm run lint
npm run test -- identity/domain
```

---

### Fase 2: Application Layer

#### Dia 2: Use Cases

**Criar:**
- `src/modules/identity/application/use-cases/login.use-case.ts` — Orquestração
- `src/modules/identity/application/use-cases/login.use-case.spec.ts` — Testes
- `src/modules/identity/application/dto/login-*.dto.ts` — DTOs

**Validar:**
```bash
npm run test -- identity/application
```

---

### Fase 3: Infrastructure Layer

#### Dia 3: Persistence + JWT

**Criar:**
- `src/modules/identity/infrastructure/persistence/typeorm/user.orm-entity.ts`
- `src/modules/identity/infrastructure/persistence/typeorm/typeorm-user.repository.ts`
- `src/modules/identity/infrastructure/persistence/mappers/user.mapper.ts`
- `src/modules/identity/infrastructure/jwt/jwt-token.service.ts`
- `src/modules/identity/infrastructure/jwt/jwt.strategy.ts`

**Criar migration:**
```bash
npm run typeorm migration:create src/migrations/CreateUsersTable
```

**Conteúdo da migration:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organizationId UUID NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (organizationId) REFERENCES organizations(id)
);

CREATE INDEX idx_users_organizationId ON users(organizationId);
CREATE INDEX idx_users_email ON users(email);
```

**Validar:**
```bash
npm run build
npm run test -- identity/infrastructure
```

---

### Fase 4: Presentation Layer

#### Dia 4: Controller

**Criar:**
- `src/modules/identity/presentation/controllers/auth.controller.ts`
- `src/modules/identity/presentation/dto/login.*.dto.ts`

**Conectar ao app:**
- Criar `src/modules/identity/identity.module.ts`
- Importar em `src/app.module.ts`
- Registrar JwtModule

**Validar:**
```bash
npm run build
npm run start:dev
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "Test1234"}'
```

---

### Fase 5: Database e Seed

#### Dia 5: Seed do Banco

**Criar seed:**
```bash
src/database/seeds/seed-auth.ts
```

**Conteúdo:**
```typescript
// 1. Criar organização
// 2. Criar usuário com email/password conhecidos
// 3. Retornar credenciais para teste
```

**Executar:**
```bash
npm run seed:dev
# Deve retornar: 
# Email: admin@test.com
# Password: AdminTest123
```

---

### Fase 6: Testes End-to-End

#### Dia 5-6: E2E Testing

**Teste manual:**

Terminal 1 — Backend:
```bash
source ~/.nvm/nvm.sh
nvm use 22
npm run start:dev
```

Terminal 2 — Test:
```bash
# Login com credenciais do seed
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "AdminTest123"}'

# Deve retornar:
# {
#   "token": "eyJhbGc...",
#   "user": {
#     "id": "...",
#     "email": "admin@test.com",
#     "name": "Admin",
#     "organizationId": "..."
#   }
# }
```

**Usar token em requisição protegida:**
```bash
curl -X GET http://localhost:3000/projects \
  -H "Authorization: Bearer eyJhbGc..."

# Deve retornar lista de projetos da organização
```

---

## 🏗️ Estrutura Que Será Criada

```
e-engineer-backend/
├── src/modules/identity/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.ts              ← User aggregate
│   │   │   └── user.spec.ts
│   │   ├── value-objects/
│   │   │   ├── email.ts             ← Validação email
│   │   │   ├── password.ts          ← Hash com bcrypt
│   │   │   └── *.spec.ts
│   │   ├── errors/
│   │   │   ├── invalid-email.error.ts
│   │   │   ├── invalid-password.error.ts
│   │   │   ├── user-already-exists.error.ts
│   │   │   └── invalid-credentials.error.ts
│   │   ├── repositories/
│   │   │   └── user.repository.ts   ← Interface
│   │   └── events/
│   │       └── user-created.event.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── login.use-case.ts
│   │   │   ├── login.use-case.spec.ts
│   │   │   └── create-user.use-case.ts
│   │   └── dto/
│   │       ├── login-input.dto.ts
│   │       └── login-output.dto.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/typeorm/
│   │   │   ├── user.orm-entity.ts
│   │   │   └── typeorm-user.repository.ts
│   │   ├── mappers/
│   │   │   └── user.mapper.ts
│   │   ├── jwt/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-token.service.ts
│   │   │   └── jwt-payload.interface.ts
│   │   └── auth.guard.ts
│   │
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.controller.spec.ts
│   │   └── dto/
│   │       ├── login.request.dto.ts
│   │       └── login.response.dto.ts
│   │
│   └── identity.module.ts
│
├── src/migrations/
│   └── [timestamp]-CreateUsersTable.ts
│
├── src/database/seeds/
│   └── seed-auth.ts
│
└── AUTH.md                           ← Este prompt
```

---

## ✅ Checklist Simplificado

```
DOMAIN
- [ ] User entity com create() e restore()
- [ ] Email value object com validação
- [ ] Password value object com bcrypt
- [ ] Domain errors criados
- [ ] UserRepository interface
- [ ] Testes do domain

APPLICATION
- [ ] LoginUseCase implementado
- [ ] DTOs criados
- [ ] Testes de use case

INFRASTRUCTURE
- [ ] UserOrmEntity criada
- [ ] Repository implementation
- [ ] Mapper implementado
- [ ] JWT service criado
- [ ] JWT strategy criado
- [ ] Migration criada

PRESENTATION
- [ ] AuthController implementado
- [ ] Request/Response DTOs
- [ ] Testes de controller

INTEGRATION
- [ ] IdentityModule criado
- [ ] Importado em AppModule
- [ ] JwtModule registrado
- [ ] Environment variables

DATABASE
- [ ] Tabela users criada (migration rodada)
- [ ] Seed com usuário criado
- [ ] Índices em place

TESTING
- [ ] npm run lint passa
- [ ] npm run test passa
- [ ] npm run build passa
- [ ] POST /auth/login funciona
- [ ] Token válido em GET /projects
- [ ] Sem token = 401

DOCUMENTAÇÃO
- [ ] codex.md atualizado
- [ ] AUTH.md atualizado com decisões
- [ ] Commit com mensagem clara
```

---

## 🚨 Pontos Críticos (NÃO ESQUECER)

| Ponto | Por Quê | Como Verificar |
|-------|---------|----------------|
| **TenantScope em findByEmail** | Multi-tenancy | Repository recebe scope, usa organizationId |
| **Password como hash no banco** | Segurança | Nunca comparar raw strings, usar bcrypt |
| **Token com sub + organizationId** | Multi-tenancy | JWT contém organizationId para validação |
| **Erro genérico em login** | Segurança | Não expor se email existe ou password errado |
| **JwtAuthGuard global** | Proteção | Todas rotas protegidas com @UseGuards |

---

## 📌 Decisões Já Tomadas (Aplicam Aqui)

De acordo com `master.md` e `codex.md`:

✅ **Multi-tenancy:** Single database + organizationId obrigatório  
✅ **Architecture:** Clean Architecture + DDD (Domain → Application → Infrastructure → Presentation)  
✅ **TypeORM:** Isolado na infrastructure (não expõe ORM entities como domínio)  
✅ **Repositories:** Interfaces no domínio, implementações na infra  
✅ **DTOs:** Em application (entrada) e presentation (saída)  
✅ **Tests:** Unitários cobrindo domain, use cases, e controller  
✅ **Commits:** Pequenos e coesos (ex: `feat(identity): implement login use case`)

---

## 🎯 Sucesso = Quando...

```
✅ Usuário pode fazer login
✅ JWT token retornado
✅ Token validado em rotas protegidas
✅ Testes passando (npm run test)
✅ Build sem errors (npm run build)
✅ Documentação atualizada
✅ Pronto para Frontend integrar
```

---

## 🔗 Próximo

Uma vez que autenticação estiver 100% pronta:

```
FASE 1 CONTINUAÇÃO:
1. Backend: GetProjects use case
2. Frontend: Login page + auth store
3. Frontend: Axios com interceptor JWT
4. Frontend: Projects list page
5. E2E: Testar fluxo completo
```

---

## 📞 Se Ficar Perdido

1. **Arquitetura?** → Leia `../master.md` seção "Princípios Arquiteturais"
2. **Pattern?** → Veja `src/modules/projects/` (já tem exemplo aplicado)
3. **DDD?** → Consulte `src/shared/domain/`
4. **NestJS?** → Veja `src/app.module.ts`
5. **Decisões Anteriores?** → Leia `codex.md`

---

## 📝 Notas da Sessão

**Início:** 25/05/2026 - User request para começar autenticação

**Contexto:**
- Base técnica sólida já existe (Projects como exemplo)
- MVP depende 100% de autenticação funcionar
- Frontend espera estar pronto em 2-3 dias após isso
- Integração API virá logo depois

**Stack confirmado:**
- Usar bcrypt para password hashing (npm install bcrypt)
- JWT TTL de 24h por enquanto
- Email + organizationId composto (único por tenant)
- Sem 2FA ou refresh tokens por agora (Fase 3)

---

**Pronto para implementar! 🚀**

Próximo passo: Iniciar com Domain layer (User entity + value objects)


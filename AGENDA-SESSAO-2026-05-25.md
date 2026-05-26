# 📅 AGENDA: Sessão Autenticação Backend (25/05/2026)

**Status:** ▶️ PRONTO PARA COMEÇAR  
**Objetivo:** Estruturar e iniciar implementação de autenticação JWT  
**Time:** ~3-5 dias de desenvolvimento

---

## 🎯 O Que Será Feito Esta Sessão

### ✅ Concluído Hoje
- [x] Análise completa do projeto (Fase 0)
- [x] Identificação de bloqueadores para MVP
- [x] Criação de roadmap (Fase 1, 2, 3)
- [x] Estruturação do prompt de autenticação
- [x] Documentação de sessão

### ⏩ Próximos: Implementação

**Ordem recomendada (passo a passo):**

1. **Revisar AUTH.md** (este arquivo lista tudo o que precisa ser feito)
2. **Criar Domain layer:**
   - User entity com Aggregate Root
   - Email value object
   - Password value object (com bcrypt)
   - Domain errors
   - Repository interface

3. **Criar Application layer:**
   - LoginUseCase
   - DTOs de entrada/saída

4. **Criar Infrastructure layer:**
   - UserOrmEntity
   - Repository implementation
   - JWT Token Service
   - JWT Strategy

5. **Criar Presentation layer:**
   - AuthController
   - Request/Response DTOs
   - Register Identity module

6. **Database:**
   - Migration para tabela users
   - Seed com usuário de teste

7. **Testing:**
   - Testes unitários (domain, application, controller)
   - Testes E2E (login real no banco)

---

## 📂 Arquivos Criados Para Referência

| Arquivo | Localização | Propósito |
|---------|-------------|----------|
| **RESUMO-EXECUTIVO.md** | `/RESUMO-EXECUTIVO.md` | Visão 1 página do MVP |
| **ANALISE-MVP-2026-05-25.md** | `/ANALISE-MVP-2026-05-25.md` | Análise completa (50+ páginas) |
| **QUICK-START-FASE1.md** | `/QUICK-START-FASE1.md` | Checklist operacional |
| **HISTORICO-DESENVOLVIMENTO.md** | `/HISTORICO-DESENVOLVIMENTO.md` | O que foi feito até agora |
| **AUTH.md** | `./AUTH.md` | ⬅️ **Prompt desta sessão** |
| **SESSAO-AUTENTICACAO.md** | `./SESSAO-AUTENTICACAO.md` | Guia de sessão |

---

## 🎓 Regras Que Devem Ser Respeitadas

Ao implementar, SEMPRE seguir:

### Do master.md
- ✅ Clean Architecture + DDD
- ✅ Separação entre Domain, Application, Infrastructure, Presentation
- ✅ Controllers finos (delegam para use cases)
- ✅ Entidades de domínio concentram comportamento
- ✅ TypeORM isolado em infrastructure
- ✅ Repositórios com TenantScope explícito
- ✅ DTOs em application/presentation
- ✅ Multi-tenancy: organizationId obrigatório
- ✅ Commits pequenos e coesos

### Específico de Autenticação
- ✅ Password com bcrypt (não plain text)
- ✅ JWT com userId + organizationId
- ✅ Erro genérico em login (não expor se email existe)
- ✅ JwtAuthGuard em rotas protegidas
- ✅ Testes unitários cobrindo casos de erro

---

## 📋 Exemplo de Como Começar

### 1️⃣ Primeiro Arquivo: User Entity

**Localização:** `src/modules/identity/domain/entities/user.ts`

**Deve seguir o padrão:**
- Estender `AggregateRoot` (já existe em `shared/domain/entities`)
- Implementar `create()` como factory method
- Implementar `restore()` para recuperar do banco
- Getters para cada propriedade
- Métodos de negócio (ex: `verifyPassword()`)
- Registrar domain events

**Template (copiar de Projects se necessário):**
```typescript
import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';

export interface UserProps {
  organizationId: OrganizationId;
  email: string; // Email value object
  password: string; // Password value object
  name: string;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    email: string;
    password: string;
    name: string;
  }): User {
    // Criar e retornar user
    // Registrar UserCreatedEvent
  }

  static restore(props: UserProps, id: UniqueEntityId): User {
    // Restaurar do banco
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  // ... outros getters

  verifyPassword(rawPassword: string): boolean {
    // Usar password value object para verificar
  }
}
```

---

## 🏃 Quick Start Hoje

Se quiser começar implementação AGORA:

```bash
# 1. Terminal 1: Backend
cd /home/lkt/work/e_engineer/e-engineer-backend
source ~/.nvm/nvm.sh
nvm use 22
npm install  # Se necessário

# 2. Terminal 2: Começar a implementar
# Abrir src/modules/identity/domain/entities/user.ts
# Copiar padrão de src/modules/projects/domain/entities/project.ts
# Adaptar para User + email + password
```

---

## 📞 Referência Rápida de Recursos

**Se ficar em dúvida durante implementação:**

| Dúvida | Consulte |
|--------|----------|
| "Como estruturar domain entity?" | `src/modules/projects/domain/entities/project.ts` |
| "Como criar use case?" | `src/modules/projects/application/use-cases/create-project.use-case.ts` |
| "Como implementar repository?" | `src/modules/projects/infrastructure/persistence/typeorm/typeorm-project.repository.ts` |
| "Como criar controller?" | `src/modules/projects/presentation/controllers/projects.controller.ts` |
| "Multi-tenancy rules?" | `../master.md` seção "Multi-tenancy" |
| "Clean Architecture?" | `../master.md` seção "Princípios Arquiteturais" |
| "Shared kernel disponível?" | `src/shared/domain/` e `src/shared/application/` |

---

## 🎯 Hoje = Estrutura Pronta Para Implementação

### Antes
❌ Não tinha autenticação  
❌ Não tinha roadmap claro  
❌ Não tinha documentação de como fazer  

### Agora
✅ Roadmap completo (3 fases)  
✅ Prompt detalhado em AUTH.md  
✅ Exemplo já existe (Projects)  
✅ Regras claras a seguir  
✅ Pronto para desenvolver  

---

## ✨ Destaque: O Que Você Tem Agora

```
/e-engineer-backend/
├── AUTH.md                    ← Prompt completo de implementação
├── SESSAO-AUTENTICACAO.md     ← Guia prático desta sessão
├── src/modules/projects/      ← Exemplo já implementado
│   ├── domain/                  (copiar padrão daqui)
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
└── src/shared/                ← Base reutilizável
    ├── domain/entities/         (Entity, AggregateRoot)
    ├── application/             (TenantScope)
    └── infrastructure/          (TypeORM base)
```

---

## 🚀 Próximas 48h Ideais

**Se implementar focado:**

```
DIA 1 (hoje/amanhã):
  - Domain layer (User entity + value objects + errors)
  - Testes de domain
  
DIA 2:
  - Application layer (LoginUseCase)
  - Testes de use case
  
DIA 3:
  - Infrastructure (ORM entity + repository + JWT)
  - Presentation (Controller)
  - Module registration
  
DIA 4:
  - Database (migration + seed)
  - E2E testing
  
DIA 5:
  - Refinamentos
  - Documentação (atualizar codex.md)
  - Commit
```

**Resultado:** Frontend pode começar a integrar (LoginPage + auth store)

---

## 📊 Status da Sessão Atual

```
┌────────────────────────────────────┐
│ ANÁLISE E PLANEJAMENTO ✅ 100%    │
├────────────────────────────────────┤
│ • Análise completa                  │
│ • Roadmap definido                  │
│ • Documentação criada               │
│ • Prompt estruturado                │
│ • Regras clarificadas               │
└────────────────────────────────────┘
                  ↓
┌────────────────────────────────────┐
│ IMPLEMENTAÇÃO ⏳ PRONTO PARA      │
│ COMEÇAR                             │
├────────────────────────────────────┤
│ • Auth.md pronto                    │
│ • Padrão em Projects disponível     │
│ • Stack confirmado                  │
│ • Checklist criado                  │
└────────────────────────────────────┘
```

---

## 💡 Filosofia da Implementação

**Ao começar, lembre:**

1. **Copy & Adapt, não Do From Scratch**
   - Projects já tem User, Entity, UseCase, Controller
   - Copiar estrutura e adaptar para auth

2. **Tests First Thinking**
   - Testar domain layer antes de persistência
   - Testar use case com mocks
   - Testar controller com mocks

3. **Small, Focused PRs**
   - User entity alone (com testes)
   - Value objects separado
   - UseCase separado
   - Não misturar tudo em 1 commit

4. **Documentation as You Go**
   - Anotar decisões em AUTH.md
   - Atualizar codex.md ao final
   - Deixar notas para próxima sessão

---

## 🎓 Aprendizado Acumulado

De 3 sessões de análise e planejamento, este projeto agora tem:

- ✅ Arquitetura clara (Clean + DDD)
- ✅ Multi-tenancy desde o início
- ✅ Exemplo já aplicado (Projects)
- ✅ Documentação ao nível de enterprise
- ✅ Roadmap para MVP pronto
- ✅ Prompt detalhado para cada fase
- ✅ Continuidade garantida entre sessões

**Objetivo:** Quando novo dev entrar, consegue ramp-up em 2h e começar a codificar

---

## 📌 Próximos Commits Esperados

Após implementação de autenticação, esperamos ver:

```
feat(identity): create user domain entity with validation
feat(identity): implement email and password value objects
feat(identity): create login use case with JWT generation
feat(identity): implement user repository with TypeORM
feat(identity): add JWT authentication strategy
feat(identity): create auth controller with login endpoint
feat(auth): add users table migration
feat(auth): seed test user for manual testing
test(identity): cover authentication flow
```

---

## ✅ Checklist Final (Antes de Começar Código)

- [ ] Leu AUTH.md completamente
- [ ] Entendeu o padrão em Projects module
- [ ] Confirmou Node 22 rodando
- [ ] Terminal aberto em e-engineer-backend
- [ ] Decided on password requirements (8 chars min, uppercase+number?)
- [ ] Decided on JWT TTL (24h recomendado)
- [ ] Começar com User entity

---

## 🎬 AÇÃO: Começar Agora

**Comando para iniciar:**

```bash
# Terminal do backend
cd /home/lkt/work/e_engineer/e-engineer-backend
source ~/.nvm/nvm.sh
nvm use 22

# Criar pasta
mkdir -p src/modules/identity/{domain/entities,domain/value-objects,domain/errors,domain/repositories}

# Abrir AUTH.md para referência
cat AUTH.md | less

# Começar: copiar padrão de Project entity
# src/modules/projects/domain/entities/project.ts
# Adaptar para User + email + password
```

---

**Sessão de Análise e Planejamento Concluída! 🎉**

**Próxima:** Implementação de Autenticação Backend


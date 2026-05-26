# 🔐 Autenticação Backend - Prompt de Sessão Codex

**Data de Criação:** 25 de maio de 2026  
**Status:** Implementado no backend (Fase 1)  
**Prioridade:** 🔴 CRÍTICA (MVP depende disso)  
**Tempo Estimado:** 3-5 dias

---

## 📋 PRÉ-LEITURA OBRIGATÓRIA

Antes de iniciar esta sessão:

1. **Leia [`../master.md`](../master.md)** — Guia principal do projeto
2. **Leia [`./codex.md`](./codex.md)** — Decisões arquiteturais anteriores
3. **Leia [`../ANALISE-MVP-2026-05-25.md`](../ANALISE-MVP-2026-05-25.md)** — Análise de MVP
4. **Leia [`../QUICK-START-FASE1.md`](../QUICK-START-FASE1.md)** — Checklist operacional

---

## 🎯 OBJETIVO DESTA SESSÃO

Implementar o módulo **Identity** com autenticação completa (JWT-based), seguindo Clean Architecture + DDD, de forma que:

1. Usuários possam fazer login com email/password
2. JWT token seja gerado e validado corretamente
3. Token seja incluído no header Authorization de requisições protegidas
4. Todas as rotas que precisam de autenticação estejam protegidas
5. Contexto de usuário (userId, organizationId) esteja disponível em use cases
6. Multi-tenancy seja respeitado (usuário só acessa recursos de sua organização)

---

## 🏗️ CONTEXTO ARQUITETURAL

### Decisões Já Tomadas (Não Alterar)

**Multi-tenancy:**
- Single database, single schema
- `organizationId` obrigatório em todas as entidades de negócio
- TenantScope explícito em repositórios e use cases
- Nenhuma consulta ignora organizationId

**Clean Architecture + DDD:**
- Camadas: Domain → Application → Infrastructure → Presentation
- Controllers finos (apenas recebem e delegam)
- Use cases orquestram lógica
- Entidades de domínio concentram comportamento
- TypeORM isolado em infrastructure (não expõe entidades ORM como domínio)
- DTOs de entrada/saída em Application/Presentation

**Shared Kernel Já Existente:**
- `Entity` e `AggregateRoot` — Base para entidades
- `UniqueEntityId` — Identificador
- `OrganizationId` — Value object de tenant
- `ValueObject` — Base para value objects
- `DomainEvent` — Estrutura de eventos
- `TenantScope` — Escopo de tenant para repositórios
- `TenantContext` — Contexto de tenant extraído de requisição
- `DomainEventPublisher` — Interface para publicação

**TypeORM Base:**
- `TenantScopedOrmEntity` — Base com organizationId, createdAt, updatedAt
- `TypeormTenantScopedRepository<T>` — Base de repository com tenant-awareness

---

## 📐 ARQUITETURA A IMPLEMENTAR

### Estrutura de Pastas

```
src/modules/identity/
├── domain/
│   ├── entities/
│   │   ├── user.ts                    [Aggregate Root]
│   │   └── user.spec.ts               [Teste da entidade]
│   ├── errors/
│   │   ├── invalid-email.error.ts
│   │   ├── invalid-password.error.ts
│   │   ├── user-already-exists.error.ts
│   │   └── invalid-credentials.error.ts
│   ├── value-objects/
│   │   ├── email.ts                   [Value Object]
│   │   ├── password.ts                [Value Object com hash]
│   │   └── [Testes correspondentes]
│   ├── repositories/
│   │   └── user.repository.ts         [Interface]
│   └── events/
│       └── user-created.event.ts      [Domain Event]
│
├── application/
│   ├── use-cases/
│   │   ├── login.use-case.ts          [Orquestra login + JWT]
│   │   ├── login.use-case.spec.ts     [Teste]
│   │   ├── create-user.use-case.ts    [Para seed/admin]
│   │   └── create-user.use-case.spec.ts
│   └── dto/
│       ├── login-input.dto.ts
│       ├── login-output.dto.ts
│       ├── create-user-input.dto.ts
│       └── create-user-output.dto.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── user.orm-entity.ts     [Mapeamento TypeORM]
│   │   │   └── typeorm-user.repository.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── jwt/
│       ├── jwt.strategy.ts            [NestJS JWT strategy]
│       ├── jwt-payload.interface.ts   [Interface do JWT]
│       └── jwt-token.service.ts       [Geração/validação de token]
│
├── presentation/
│   ├── controllers/
│   │   ├── auth.controller.ts         [POST /auth/login]
│   │   └── auth.controller.spec.ts
│   └── dto/
│       ├── login.request.dto.ts       [Request do controller]
│       └── login.response.dto.ts      [Response do controller]
│
└── identity.module.ts                 [NestJS module]
```

---

## 📝 ESPECIFICAÇÃO DE IMPLEMENTAÇÃO

### 1. Domain Layer

#### 1.1 User Entity (Aggregate Root)

**Arquivo:** `src/modules/identity/domain/entities/user.ts`

**Responsabilidades:**
- Validar email (formato válido)
- Validar password (força mínima)
- Gerar ID único
- Implementar invariantes de domínio
- Registrar eventos (UserCreatedEvent)

**Comportamento esperado:**
```typescript
// Criação
const user = User.create({
  organizationId: OrganizationId.create('org-123'),
  email: 'john@company.com',
  password: 'SecurePass123!',
  name: 'John Doe',
});

// Restauração do banco
const restored = User.restore(props, id);

// Getters
user.id                    // string
user.organizationId        // OrganizationId
user.email                 // Email (value object)
user.password              // Password (value object com hash)
user.name                  // string
user.createdAt             // Date
user.updatedAt             // Date

// Métodos de negócio
user.verifyPassword(rawPassword) // boolean
user.pullDomainEvents()          // DomainEvent[]
```

**Validações de Domínio:**
- Email não pode ser vazio
- Email deve ser formato válido (ex: test@example.com)
- Password não pode ser vazio
- Password mínimo 8 caracteres (regra de negócio)
- Password deve ter letra maiúscula, minúscula e número (requerido?)
- Name não pode ser vazio

**Decisão de Senha:**
- Usar bcrypt para hash (npm install bcrypt @types/bcrypt)
- Hash acontece no value object Password
- Comparação via `verifyPassword(rawPassword: string): boolean`
- Nunca retornar raw password (sempre hashed)

#### 1.2 Value Objects

**Email (src/modules/identity/domain/value-objects/email.ts)**
- Validar formato
- Comparação por igualdade
- Implementar `equals()` e `toString()`

**Password (src/modules/identity/domain/value-objects/password.ts)**
- Receber raw password na criação
- Hash automaticamente via bcrypt
- Método `verify(rawPassword: string): Promise<boolean>`
- Nunca expor raw password

#### 1.3 Domain Errors

**Arquivo:** `src/modules/identity/domain/errors/`

```typescript
// invalid-email.error.ts
export class InvalidEmailError extends DomainError {
  constructor() {
    super('Email is invalid.');
  }
}

// invalid-password.error.ts
export class InvalidPasswordError extends DomainError {
  constructor(reason: string) {
    super(`Password is invalid: ${reason}`);
  }
}

// user-already-exists.error.ts
export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} already exists.`);
  }
}

// invalid-credentials.error.ts
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password.');
  }
}
```

#### 1.4 User Repository Interface

**Arquivo:** `src/modules/identity/domain/repositories/user.repository.ts`

```typescript
import { TenantScope } from '../../../../shared/application/tenancy/tenant-scope';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string, scope: TenantScope): Promise<User | null>;
  findById(id: string, scope: TenantScope): Promise<User | null>;
  findByOrganizationId(organizationId: OrganizationId, scope: TenantScope): Promise<User[]>;
}
```

**Notas:**
- TenantScope explícito em todos os métodos
- Não retorna null sem motivo (validar em use case)
- FindByEmail NÃO precisa de scope (emails são únicos globalmente? decidir)
  - Recomendação: Manter email único por tenant (email + organizationId composto)

#### 1.5 Domain Events

**Arquivo:** `src/modules/identity/domain/events/user-created.event.ts`

```typescript
export class UserCreatedEvent extends BaseDomainEvent {
  static eventName = 'user.created';

  constructor(public readonly data: {
    userId: string;
    organizationId: string;
    email: string;
  }) {
    super(UserCreatedEvent.eventName);
  }
}
```

---

### 2. Application Layer

#### 2.1 Login Use Case

**Arquivo:** `src/modules/identity/application/use-cases/login.use-case.ts`

**Responsabilidades:**
- Orquestrar fluxo de login
- Validar credenciais
- Gerar JWT token
- Retornar token + user data

**Comportamento:**
```typescript
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject('JWT_TOKEN_SERVICE') private jwtTokenService: JwtTokenService,
    @Inject(DOMAIN_EVENT_PUBLISHER) private eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: LoginInputDto): Promise<Result<LoginOutputDto, Error>> {
    // 1. Validar input (email e password presentes)
    // 2. Buscar usuário por email (sem tenant scope? ou com?)
    // 3. Se não encontrar → InvalidCredentialsError
    // 4. Verificar password
    // 5. Se inválido → InvalidCredentialsError
    // 6. Gerar JWT token com userId e organizationId
    // 7. Retornar token + user data
  }
}
```

**Input DTO:**
```typescript
export interface LoginInputDto {
  email: string;
  password: string;
}
```

**Output DTO:**
```typescript
export interface LoginOutputDto {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
  };
}
```

**Tratamento de Erro:**
- Use case retorna `Result<LoginOutputDto, Error>`
- Controller valida `result.isFail()` e retorna 401 Unauthorized
- Nunca expor se email não existe vs password errado (segurança)

#### 2.2 Create User Use Case (Para Seed/Admin)

**Arquivo:** `src/modules/identity/application/use-cases/create-user.use-case.ts`

**Responsabilidades:**
- Criar novo usuário
- Validar unicidade de email (por tenant)
- Publicar UserCreatedEvent

**Nota:** Este use case é para seed/admin. Login não cria usuário (fluxo simplificado por enquanto).

---

### 3. Infrastructure Layer

#### 3.1 User ORM Entity

**Arquivo:** `src/modules/identity/infrastructure/persistence/typeorm/user.orm-entity.ts`

```typescript
@Entity('users')
export class UserOrmEntity extends TenantScopedOrmEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hash

  @Column()
  name: string;

  @Column({ nullable: true })
  lastLoginAt: Date;
}
```

**Notas:**
- `TenantScopedOrmEntity` já tem organizationId, createdAt, updatedAt
- Email é unique (assumir que emails são únicos no sistema)
- Password armazenado como hash (bcrypt)
- lastLoginAt pode ser nulo inicialmente

#### 3.2 User Repository Implementation

**Arquivo:** `src/modules/identity/infrastructure/persistence/typeorm/typeorm-user.repository.ts`

```typescript
@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(user: User): Promise<void> {
    // Usar mapper para converter User → UserOrmEntity
    // INSERT ou UPDATE na tabela users
    // Publicar eventos se necessário
  }

  async findByEmail(email: string, scope: TenantScope): Promise<User | null> {
    // SELECT * FROM users WHERE email = ? AND organizationId = ?
    // Usar mapper para converter UserOrmEntity → User
    // Retornar null se não encontrar
  }

  async findById(id: string, scope: TenantScope): Promise<User | null> {
    // SELECT * FROM users WHERE id = ? AND organizationId = ?
    // Importante: SEMPRE incluir organizationId (multi-tenancy)
  }
}
```

#### 3.3 User Mapper

**Arquivo:** `src/modules/identity/infrastructure/persistence/mappers/user.mapper.ts`

```typescript
export class UserMapper {
  static toPersistence(user: User): Partial<UserOrmEntity> {
    return {
      id: user.id,
      organizationId: user.organizationId.toString(),
      email: user.email.toString(),
      password: user.password.getHash(), // Password como hash
      name: user.name,
    };
  }

  static toDomain(orm: UserOrmEntity): User {
    return User.restore({
      organizationId: OrganizationId.create(orm.organizationId),
      email: orm.email,
      password: orm.password, // Já é hash
      name: orm.name,
    }, new UniqueEntityId(orm.id));
  }
}
```

#### 3.4 JWT Token Service

**Arquivo:** `src/modules/identity/infrastructure/jwt/jwt-token.service.ts`

```typescript
@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(userId: string, organizationId: string): string {
    const payload = {
      sub: userId, // Subject é o userId
      organizationId,
    };
    return this.jwtService.sign(payload);
  }

  validateToken(token: string): JwtPayload {
    // Lança exceção se inválido
    return this.jwtService.verify(token);
  }
}

export interface JwtPayload {
  sub: string; // userId
  organizationId: string;
  iat?: number;
  exp?: number;
}
```

#### 3.5 JWT Strategy (NestJS)

**Arquivo:** `src/modules/identity/infrastructure/jwt/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
    };
  }
}
```

---

### 4. Presentation Layer

#### 4.1 Auth Controller

**Arquivo:** `src/modules/identity/presentation/controllers/auth.controller.ts`

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    // 1. Validar DTO (email, password presentes)
    // 2. Chamar use case
    // 3. Se fail → BadRequestException ou UnauthorizedException (401)
    // 4. Se ok → retornar token + user data
  }
}
```

#### 4.2 Request/Response DTOs

**Arquivo:** `src/modules/identity/presentation/dto/login.request.dto.ts`

```typescript
export class LoginRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**Arquivo:** `src/modules/identity/presentation/dto/login.response.dto.ts`

```typescript
export class LoginResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
  };
}
```

---

### 5. Module Registration

#### 5.1 Identity Module

**Arquivo:** `src/modules/identity/identity.module.ts`

```typescript
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' }, // Decidir TTL
      }),
    }),
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  providers: [
    // Use Cases
    LoginUseCase,
    CreateUserUseCase,
    // Repositories
    {
      provide: USER_REPOSITORY,
      useClass: TypeormUserRepository,
    },
    // Services
    JwtTokenService,
    JwtStrategy,
    // Mappers
    UserMapper,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy], // Para usar em outros módulos
})
export class IdentityModule {}
```

#### 5.2 App Module Update

No `src/app.module.ts`:
- Importar `IdentityModule`
- Registrar `JwtModule` globalmente se necessário
- Registrar `JwtAuthGuard` global se autenticação for default

---

### 6. Auth Guard (Proteção de Rotas)

**Arquivo:** `src/shared/infrastructure/auth/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
```

**Uso em controllers:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-route')
protectedRoute(@Request() req: any) {
  const userId = req.user.userId;
  const organizationId = req.user.organizationId;
  // ...
}
```

---

### 7. Environment Variables

Adicionar a `.env`:
```env
JWT_SECRET=your-very-secure-secret-key-here-min-32-chars
JWT_EXPIRES_IN=24h
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Domain Layer
- [ ] User entity criada (com métodos create, restore, verifyPassword)
- [ ] Email value object implementado
- [ ] Password value object implementado (com bcrypt)
- [ ] Todos os domain errors criados
- [ ] UserRepository interface definida
- [ ] UserCreatedEvent criado
- [ ] Testes unitários de User entity (mínimo 80% coverage)

### Application Layer
- [ ] LoginUseCase implementado
- [ ] CreateUserUseCase implementado
- [ ] DTOs de entrada/saída criados
- [ ] Testes unitários de use cases

### Infrastructure Layer
- [ ] UserOrmEntity criada
- [ ] TypeormUserRepository implementada
- [ ] UserMapper implementado
- [ ] JwtTokenService criado
- [ ] JwtStrategy criado
- [ ] Migrations TypeORM para tabela users

### Presentation Layer
- [ ] AuthController implementado (POST /auth/login)
- [ ] Request/Response DTOs criados
- [ ] Validação de DTO funcionando
- [ ] Testes de controller

### Integration
- [ ] IdentityModule importado em AppModule
- [ ] JwtModule registrado
- [ ] JwtAuthGuard disponível
- [ ] .env com JWT_SECRET

### Database
- [ ] Tabela users criada (migration)
- [ ] Índice em email
- [ ] Seed com usuário de teste

### Validações
- [ ] `npm run lint` — Sem errors
- [ ] `npm run test` — Tests passando
- [ ] `npm run build` — Build sem errors
- [ ] Teste manual: POST /auth/login com credenciais corretas → retorna token
- [ ] Teste manual: POST /auth/login com credenciais erradas → retorna 401
- [ ] Teste manual: GET /projects com token válido → funciona
- [ ] Teste manual: GET /projects sem token → retorna 401

---

## 📋 DECISÕES A TOMAR ANTES DE COMEÇAR

| Decisão | Opções | Recomendação |
|---------|--------|-------------|
| **Email Único Por Quem?** | Global vs Por Tenant | **Global no MVP** (mantem login apenas com email/password; revisar quando houver seleção de organização) |
| **JWT TTL** | 1h, 24h, 7d, etc | **24h** para MVP |
| **Password Minimo** | 6, 8, 12 chars | **8 chars** + complexity check |
| **Password Complexity** | Uppercase, number, special | **Uppercase + Lowercase + Number** |
| **Refresh Token?** | Sim/Não | **Não** (por enquanto) |
| **2FA?** | Sim/Não | **Não** (Fase 3) |
| **Rate Limiting?** | Sim/Não | **Não** (por enquanto) |

### Decisões finais desta implementação

- Email ficou globalmente unico para compatibilizar com o contrato `POST /auth/login` recebendo apenas `email` e `password`.
- JWT usa `sub` para `userId` e `organizationId` para contexto de tenant.
- `POST /projects` ja foi protegido por `JwtAuthGuard` e passou a usar o tenant do token, nao do body.
- `JWT_SECRET` e `JWT_EXPIRES_IN` foram adicionados a validacao de ambiente e `.env.example`.

---

## 🎯 CRITÉRIO DE SUCESSO

Ao final desta sessão, você terá:

✅ **Autenticação completa funcionando:**
- [ ] Usuário pode fazer login
- [ ] JWT token gerado e retornado
- [ ] Token é validado em rotas protegidas

✅ **Testes passando:**
- [ ] `npm run test` com cobertura
- [ ] Casos: login correto, credenciais erradas, user não existe

✅ **Documentação:**
- [ ] `codex.md` atualizado com decisões de autenticação
- [ ] Este arquivo (AUTH.md) atualizado com decisões finais

✅ **Pronto para próxima fase:**
- [ ] Frontend pode fazer login e receber token
- [ ] GetProjects use case pode ser implementado protegido

---

## 🚀 PRÓXIMOS PASSOS APÓS ISTO

Uma vez que autenticação estiver completa:

1. **Frontend:** Criar LoginPage.vue + auth store (Pinia)
2. **Frontend:** Integrar Axios com interceptor de token
3. **Backend:** Implementar GetProjects use case (listando apenas da org)
4. **Frontend:** Criar ProjectsList.vue integrada com API real
5. **E2E:** Testar fluxo completo: Login → Dashboard → Create Project → Ver em Lista

---

## 📚 REFERÊNCIAS

- **Clean Architecture & DDD:** https://martinfowler.com/articles/patterns-of-distributed-systems/
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8949
- **NestJS Auth:** https://docs.nestjs.com/security/authentication
- **Bcrypt:** https://github.com/kelektiv/node.bcrypt.js
- **Projeto Master Guide:** `../master.md`
- **Análise MVP:** `../ANALISE-MVP-2026-05-25.md`

---

## 🔗 CONTINUIDADE

**Ao terminar esta sessão:**
1. Atualizar `codex.md` com decisões tomadas
2. Fazer commit com `feat(identity): implement authentication with JWT`
3. Anotar quaisquer desvios do plano neste arquivo
4. Deixar notas para próxima sessão

**Próxima Sessão:**
- Frontend: Implementar login page
- Ler este arquivo (AUTH.md) para contexto
- Ler `../QUICK-START-FASE1.md` para ordem de tarefas

---

## 📞 SUPORTE

Se surgirem dúvidas durante a implementação:

1. Consulte `../master.md` para princípios
2. Consulte `./codex.md` para decisões anteriores
3. Revise exemplos em `src/modules/projects/` (pattern já aplicado)
4. Registre decisões aqui mesmo neste arquivo

---

**Prompt pronto para sessão de implementação! 🚀**

# 🏗️ E-Engineer Infrastructure - Guia de Evolução

> Documento que descreve como evoluir a infraestrutura de desenvolvimento para suportar múltiplos serviços.

---

## 📌 Visão Atual (26/05/2026)

### Estrutura Presente

```
e-engineer-backend/
├── docker-compose.yml      # Services: PostgreSQL
├── scripts/
│   └── db-reset.sh        # Reset banco local
├── DEVELOPMENT.md         # Guia de dev
└── src/
    ├── shared/
    ├── modules/
    └── database/
```

- **Network**: `e-engineer-network` (compartilhada)
- **Volume**: `e-engineer-postgres-data` (persistente)
- **Dependências**: Node.js 24+, npm

---

## 🎯 Visão Futura (e-engineer-docker)

### Objetivo

Um **container pai** (`e-engineer-docker`) que orquestre todos os serviços do ecossistema:

```
e-engineer-docker/
├── docker-compose.yml          # Orquestra TODOS os serviços
├── .env.example                # Variáveis compartilhadas
├── docker/
│   ├── postgres/
│   │   ├── Dockerfile
│   │   └── init.sql
│   ├── redis/
│   ├── minio/ (S3 local)
│   └── ...
├── scripts/
│   ├── setup.sh               # Setup inicial
│   ├── reset-all.sh           # Reset completo
│   └── logs.sh                # Centralize logs
└── README.md
```

### Serviços Esperados

1. **PostgreSQL** (compartilhado)
2. **Redis** (cache, session, queue)
3. **MinIO** (S3 local para upload de documentos)
4. **e-engineer-backend** (Node.js + NestJS)
5. **e-engineer-frontend** (Node.js + Vue 3 dev server)
6. **API Gateway / Reverse Proxy** (Nginx/Traefik)
7. **Elasticsearch** (opcional: busca e indexação)
8. **RabbitMQ / Bull** (opcional: async jobs, events)

---

## 🚀 Plano de Migração

### **Fase 1: Preparação (Agora)**
✅ Estruturar backend com network compartilhada
✅ Documentar padrões de desenvolvimento
✅ Manter scripts de reset automático

### **Fase 2: Container Pai (Quando frontend entrar)**

Quando `e-engineer-frontend` for criado:

1. Criar repositório `e-engineer-docker` (ou `e-engineer` root)
2. Mover `docker-compose.yml` para raiz
3. Frontend e backend como submodules ou referências
4. Scripts centralizados de setup/reset

**Exemplo de novo docker-compose.yml parent:**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:17-alpine
    container_name: e-engineer-postgres
    # ... config
    networks:
      - e-engineer-network

  redis:
    image: redis:7-alpine
    container_name: e-engineer-redis
    networks:
      - e-engineer-network

  backend:
    build:
      context: ./e-engineer-backend
      dockerfile: Dockerfile
    depends_on:
      - postgres
      - redis
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    networks:
      - e-engineer-network
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./e-engineer-frontend
      dockerfile: Dockerfile.dev
    environment:
      - VITE_API_URL=http://backend:3000
    networks:
      - e-engineer-network
    ports:
      - "5173:5173"

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend
    networks:
      - e-engineer-network

networks:
  e-engineer-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### **Fase 3: Extras (Quando Necessário)**

Adicionar serviços conforme necessidade:
- **MinIO** para upload de documentos técnicos
- **Elasticsearch** para busca full-text de projetos
- **RabbitMQ / Bull** para processamento assíncrono (versioning, export PDF, etc)
- **Grafana / Prometheus** para observabilidade

---

## 🧱 Monorepo Pai Atual

O repositório pai já existe em `/home/lkt/work/e_engineer` e agora contém um `docker-compose.yml` raiz que orquestra:

- `postgres` (DB compartilhado)
- `backend` (NestJS)
- `frontend` (Vue 3)

### Como usar

```bash
cd /home/lkt/work/e_engineer
docker-compose up -d
```

### Benefícios desta abordagem

- Cada aplicação fica isolada em seu próprio diretório
- O serviço pai gerencia dependências comuns (DB, rede)
- O backend e o frontend têm Dockerfiles próprios
- Fica fácil adicionar novos módulos/serviços depois

### Observação

No backend, o script `scripts/db-reset.sh` agora detecta se `psql` não está instalado localmente e usa o container `postgres` via `docker-compose` para recriar o banco.

---

## 📝 Checklist para Novos Serviços

Quando adicionar novo serviço ao ecossistema, garantir:

### Backend

- [ ] Service roda em Node.js (ou especificar versão)
- [ ] Dockerfile multi-stage (build + runtime otimizado)
- [ ] Environment variables via `.env`
- [ ] Conecta via `e-engineer-network`
- [ ] Migrations e seed preparadas
- [ ] Health check endpoint (`/health`)
- [ ] Logs estruturados (JSON)
- [ ] README com quick start local

### Frontend

- [ ] Roda em desenvolvimento com hot-reload
- [ ] Vite/Vue 3 padrão
- [ ] Build otimizado para produção
- [ ] Variáveis de ambiente em `.env.local`
- [ ] Conecta ao backend via network
- [ ] UI acessível e responsiva

### Infraestrutura

- [ ] Serviço declarado no `docker-compose.yml` parent
- [ ] Usa volumes persistentes se necessário
- [ ] Health checks configurados
- [ ] Segredos via `.env`, nunca hardcoded
- [ ] Logs agregados e monitorizáveis
- [ ] Compatível com orchestração futura (Kubernetes)

---

## 🔐 Estratégia de Secrets

**Hoje (Local Dev):**
- `.env` com defaults funcionais
- `.env.local` ignorado pelo git (gitignore)

**Futuro (Container Pai):**
- `.env.example` com variáveis necessárias
- Secrets injetados via Docker Secrets ou Vault
- CI/CD carrega segredos de variáveis de ambiente

---

## 📊 Observabilidade

**Hoje**: Logs stdout do Docker Compose

**Futuro**:
- Logs agregados (ELK / Grafana Loki)
- Rastreamento distribuído (Jaeger / Tempo)
- Métricas (Prometheus)
- Dashboard centralizado

---

## 🔄 Evolução do CI/CD

**Hoje**: Manual via npm scripts

**Futuro**:
- GitHub Actions / GitLab CI
- Build e push de imagens Docker
- Deploy automático para staging/produção
- Testes automatizados em cada PR

---

## 📚 Referências

- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Vue.js Deployment](https://vitejs.dev/guide/ssr.html)
- [Twelve-Factor App](https://12factor.net/)

---

## ❓ Próximas Perguntas

1. Quando frontend entrará no projeto?
2. Será necessário S3 local (MinIO) para upload de documentos?
3. Haverá processamento assíncrono (PDF, exports)?
4. Integração com sistemas externos (ERP, CAD)?
5. Qual será a estratégia de deploy em produção?

---

**Última atualização**: 26 de maio de 2026  
**Responsável**: Backend + DevOps

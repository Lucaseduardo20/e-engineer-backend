#!/bin/bash

# E-Engineer Database Reset Script
# Destrói e recria o banco de dados do zero com seed

set -e

echo "🗑️  Resetando banco de dados e-engineer..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "   Crie um .env baseado em .env.example"
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env | grep -v '#' | xargs)

compose_cmd=""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    compose_cmd="docker-compose"
fi

function run_psql() {
    local sql="$1"
    local db="${2:-postgres}"

    if command -v psql >/dev/null 2>&1; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" -p "$DB_PORT" -d "$db" -c "$sql"
    elif [ -n "$compose_cmd" ]; then
        echo -e "${YELLOW}🔁 Usando $compose_cmd no container postgres...${NC}"
        $compose_cmd up -d postgres
        sleep 3
        PGPASSWORD="$DB_PASSWORD" $compose_cmd exec -T postgres psql -U "$DB_USERNAME" -d "$db" -p 5432 -c "$sql"
    else
        echo -e "${RED}❌ Nem psql nem docker-compose estão disponíveis.${NC}"
        exit 1
    fi
}

# Conectar ao PostgreSQL e dropar/recriar database
echo -e "${YELLOW}⏳ Dropando banco de dados atual...${NC}"
if run_psql "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'" postgres | grep -q 1; then
    run_psql "DROP DATABASE IF EXISTS $DB_DATABASE;" postgres
fi

echo -e "${YELLOW}⏳ Criando banco de dados novo...${NC}"
run_psql "CREATE DATABASE $DB_DATABASE;" postgres

echo -e "${YELLOW}⏳ Rodando migrations...${NC}"
npm run db:migration:run

echo -e "${YELLOW}⏳ Rodando seed...${NC}"
npm run db:seed

echo -e "${GREEN}✅ Banco de dados resetado com sucesso!${NC}"
echo ""
echo "Próximos passos:"
echo "  npm run start:dev    # Inicia servidor em modo watch"
echo "  npm run test         # Roda testes"

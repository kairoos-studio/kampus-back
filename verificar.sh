#!/usr/bin/env bash
# Verificação do back-end: instala dependências, "build" (verificação de sintaxe), lint e testes.
# Os testes usam um MongoDB em memória (mongodb-memory-server descarrega o binário na 1.ª vez).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
cd "$RAIZ/m3-rest-api/project-management-server"

echo "==> npm ci"
npm ci --no-audit --no-fund

echo "==> build (node --check em todos os ficheiros .js)"
# O script "build" original é "npm install", que podia alterar o lockfile; não se usa aqui.
find . -name '*.js' -not -path './node_modules/*' -not -path './.mongo-data/*' -print0 \
  | xargs -0 -n1 node --check

echo "==> lint"
npm run lint

echo "==> testes"
npm test

# Só quando há repositório git; a verificação independente corre numa cópia sem .git
# e faz esta comparação por fora.
if git -C "$RAIZ" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> ficheiros versionados inalterados"
  git -C "$RAIZ" diff --exit-code --stat
else
  echo "==> sem .git: comparação de ficheiros versionados feita pela verificação externa"
fi

echo "OK"

# Kampus (back-end, versão de 2023)

API REST em Express 4 + Mongoose 8 (MongoDB), autenticação por JWT. O código está em
`m3-rest-api/project-management-server/`. O front é o
[kampus-front](https://github.com/kairoos-studio/kampus-front).

## Correr localmente

Precisa de Node 20 ou superior (testado com Node 24). Não precisa de MongoDB instalado:
`npm run db:local` descarrega e arranca um binário do MongoDB (mongodb-memory-server),
com os dados em `.mongo-data/`. Se já tiver um MongoDB, aponte `MONGODB_URI` para ele.

```bash
cd m3-rest-api/project-management-server
npm ci
cp .env.example .env        # trocar TOKEN_SECRET por um valor aleatório local

npm run db:local            # terminal 1: MongoDB em mongodb://127.0.0.1:27017
npm run seed                # apaga e volta a criar os dados fictícios (só aceita MongoDB local)
npm start                   # terminal 2: API em http://localhost:5005
```

Contas criadas pelo seed (todas com a palavra-passe `Kampus123`, emails `@example.com`):

| Perfil | Emails |
| ------ | ------ |
| Staff  | `staff@example.com`, `bruno.staff@example.com`, `carla.staff@example.com` |
| Aluno  | `aluno@example.com`, `eduardo.aluno@example.com`, `filipa.aluna@example.com` |

Cada aluno fica com 3 tarefas e 2 notas de exemplo. Os cargos do staff não existem no código
original e ficam como `[POR CONFIRMAR: cargo]`.

O seed recusa qualquer `MONGODB_URI` que não seja `mongodb://` em `127.0.0.1`, `localhost` ou `[::1]`,
para nunca apagar dados de outra base.

### Variáveis de ambiente (`.env`)

| Variável | Para quê |
| -------- | -------- |
| `PORT` | Porta da API (omissão 5005) |
| `MONGODB_URI` | Ligação ao MongoDB (omissão `mongodb://127.0.0.1:27017/kampus`) |
| `TOKEN_SECRET` | Segredo para assinar os JWT (obrigatório) |
| `ORIGIN` | Origem do front aceite pelo CORS (`http://localhost:5173` já é aceite) |

### Verificação

```bash
./verificar.sh   # npm ci, node --check, lint e testes de integração (MongoDB em memória)
```

## Limitações conhecidas e segredos

Bugs de 2023 que ficam por corrigir, mocks e o inventário de segredos encontrados (sem valores):
ver [`docs/RELATORIO.md` no kampus-front](https://github.com/kairoos-studio/kampus-front/blob/tarefa-1-correr-localmente/docs/RELATORIO.md).
Em resumo, para este repositório:

- A API não tem autenticação nas rotas de utilizadores, tarefas e notas, e `/auth/users` devolve os hashes das palavras-passe.
- Segredo encontrado: connection string do MongoDB Atlas com credenciais em `db/index.js`. Já não está no código, mas continua na história do git.
- Única alteração de comportamento: o signup com email repetido já não derruba o servidor.

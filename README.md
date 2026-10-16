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
npm run seed                # apaga e volta a criar os dados fictícios
npm start                   # terminal 2: API em http://localhost:5005
```

Contas criadas pelo seed (todas com a palavra-passe `Kampus123`, emails `@example.com`):

| Perfil | Emails |
| ------ | ------ |
| Staff  | `staff@example.com`, `bruno.staff@example.com`, `carla.staff@example.com` |
| Aluno  | `aluno@example.com`, `eduardo.aluno@example.com`, `filipa.aluna@example.com` |

Cada aluno fica com 3 tarefas e 2 notas de exemplo.

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

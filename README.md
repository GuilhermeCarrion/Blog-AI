# blog-ia

API HTTP para um blog com geração de posts assistida por IA. A aplicação recebe uma ideia, usa um agente (Mastra + Groq) para redigir título e conteúdo em Markdown, salva o rascunho no PostgreSQL e expõe endpoints para aprovar, rejeitar e listar publicações.

Projeto de estudo de fundamentos de Node.js: o servidor usa apenas o módulo nativo `node:http`, sem framework.

## Stack

- **Node.js** com ES Modules e `node:http`
- **PostgreSQL 16** via Docker Compose, acessado com `pg`
- **Mastra** + **Groq** (`openai/gpt-oss-120b`) para gerar os posts
- **Zod** para validar a saída da IA (`{ title, content }`)

## Pré-requisitos

- Node.js 20.6 ou superior (por causa do `--env-file`)
- Docker Desktop
- Uma chave de API da [Groq](https://console.groq.com/keys)

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente (o script usa `copy`, do Windows; no Linux/Mac use `cp .env.example .env.local`):

   ```bash
   npm run env:setup
   ```

3. Preencha o `.env.local`:

   ```env
   API_HOST=localhost
   API_PORT=8080
   API_PROTOCOL=http

   GROQ_API_KEY=sua_chave
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/blog_ia
   ```

4. Suba o banco e crie a tabela:

   ```bash
   docker compose up -d
   npm run db:migrate
   ```

5. Inicie a API (reinicia sozinha ao salvar arquivos):

   ```bash
   npm run dev
   ```

## Documentação (Swagger)

Com a API rodando, a documentação interativa fica em [http://localhost:8080/docs](http://localhost:8080/docs) e a especificação OpenAPI em `/openapi.json`. A spec fica em `src/docs/openapi.js`; ao criar ou alterar uma rota, atualize-a junto.

## Testes

Testes de integração com o `node:test` nativo: sobem a API numa porta livre e usam o Postgres do Docker, então o banco precisa estar rodando e migrado.

```bash
npm test
```

Os testes não chamam a Groq: os rascunhos são inseridos direto no banco, e cada teste apaga o que criou.

## Endpoints

| Método | Rota | Descrição | Sucesso |
| ------ | ---- | --------- | ------- |
| `POST` | `/posts/draft` | Gera um rascunho a partir de `{ "idea": "..." }` | `201` |
| `GET` | `/posts` | Lista os posts; aceita `?status=draft\|approved\|rejected` | `200` |
| `GET` | `/posts/:id` | Busca um post | `200` |
| `PATCH` | `/posts/:id/approve` | Aprova um rascunho | `200` |
| `PATCH` | `/posts/:id/reject` | Rejeita um rascunho | `200` |

Respostas de sucesso vêm em `{ "data": ... }` e erros em `{ "message": "..." }`.

| Status | Quando |
| ------ | ------ |
| `400` | Body não é JSON, ideia com menos de 10 caracteres ou `status` inválido |
| `404` | Post ou rota não encontrados |
| `409` | Tentativa de aprovar/rejeitar um post que não é mais rascunho |
| `500` | Erro inesperado (o detalhe fica só no log do servidor) |

### Exemplos

```bash
curl -X POST http://localhost:8080/posts/draft \
  -H "content-type: application/json" \
  -d '{"idea":"Por que usar streams no Node.js"}'

curl "http://localhost:8080/posts?status=draft"

curl -X PATCH http://localhost:8080/posts/1/approve
```

No PowerShell 5.1, prefira `Invoke-RestMethod`, que não remove as aspas do JSON:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/posts/draft -ContentType "application/json; charset=utf-8" -Body '{"idea":"Por que usar streams no Node.js"}'
```

## Ciclo de vida de um post

```
POST /posts/draft ──► draft ──┬── approve ──► approved
                              └── reject  ──► rejected
```

Só posts em `draft` podem mudar de status. O banco também recusa qualquer status fora desses três (`CHECK` na tabela).

## Estrutura

```
src/
├── index.js                          # sobe o servidor (listen)
├── app.js                            # servidor HTTP e rotas
├── docs/openapi.js                   # spec OpenAPI e página do Swagger UI
├── http/helpers.js                   # sendJson, readJsonBody
├── errors/http-error.js              # erro com status code
├── agents/writer-agent.js            # agente redator (Mastra + Groq)
├── services/
│   ├── create-post-draft.js          # valida a ideia, chama a IA e salva
│   └── change-post-status.js         # regra: só rascunho muda de status
├── repositories/posts-repository.js  # consultas SQL parametrizadas
└── database/
    ├── connection.js                 # pool de conexões
    └── migrate.js                    # cria a tabela posts
test/
└── posts.test.js                     # testes de integração das rotas
```

As camadas só conversam com a de baixo: **rotas → services → repositories / agente → banco**. Trocar o `node:http` por Express, por exemplo, mudaria apenas o `app.js`.

## Banco de dados

Abrir o `psql` dentro do container:

```bash
docker compose exec postgres psql -U postgres -d blog_ia
```

Parar o banco mantendo os dados:

```bash
docker compose stop
```

`docker compose down -v` remove o volume e **apaga todos os posts**.

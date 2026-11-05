const error = (description) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

const postResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { data: { $ref: "#/components/schemas/Post" } },
      },
    },
  },
});

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};

const statusChange = (summary) => ({
  tags: ["Posts"],
  summary,
  parameters: [idParam],
  responses: {
    200: postResponse("Status alterado"),
    404: error("Post não encontrado"),
    409: error("O post não é mais rascunho"),
  },
});

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "blog-ia",
    version: "1.0.0",
    description:
      "API de blog com rascunhos gerados por IA (Mastra + Groq) e salvos no PostgreSQL.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "Lista os posts, do mais novo para o mais antigo",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/Status" },
          },
        ],
        responses: {
          200: {
            description: "Lista de posts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Post" },
                    },
                  },
                },
              },
            },
          },
          400: error("Status inválido"),
        },
      },
    },
    "/posts/draft": {
      post: {
        tags: ["Posts"],
        summary: "Gera um rascunho com IA a partir de uma ideia",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idea"],
                properties: {
                  idea: {
                    type: "string",
                    minLength: 10,
                    example: "Por que usar streams no Node.js",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: postResponse("Rascunho criado"),
          400: error("Body não é JSON ou a ideia tem menos de 10 caracteres"),
          500: error("Falha inesperada, por exemplo na chamada à IA"),
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Busca um post",
        parameters: [idParam],
        responses: {
          200: postResponse("Post encontrado"),
          404: error("Post não encontrado"),
        },
      },
    },
    "/posts/{id}/approve": { patch: statusChange("Aprova um rascunho") },
    "/posts/{id}/reject": { patch: statusChange("Rejeita um rascunho") },
  },
  components: {
    schemas: {
      Status: { type: "string", enum: ["draft", "approved", "rejected"] },
      Post: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          idea: { type: "string" },
          title: { type: "string" },
          content: { type: "string", description: "Markdown" },
          status: { $ref: "#/components/schemas/Status" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
};

// Swagger UI vem da CDN para não adicionar dependência; ele lê a spec em /openapi.json.
export const swaggerHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>blog-ia · API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });</script>
</body>
</html>`;

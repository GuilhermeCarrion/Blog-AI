import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { server } from "../src/app.js";
import { pool } from "../src/database/connection.js";
import { insertPost } from "../src/repositories/posts-repository.js";

// shortcut: os testes usam o mesmo banco do dev e apagam só o que criam; usar um banco próprio se começarem a conflitar.
const createdIds = [];
let baseUrl;

async function createDraft() {
  const post = await insertPost({
    idea: "ideia de teste",
    title: "Título de teste",
    content: "conteúdo de teste",
  });
  createdIds.push(post.id);
  return post;
}

async function request(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { "content-type": "application/json" },
    body,
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  await new Promise((resolve) => server.listen(0, resolve)); // porta 0: o SO escolhe uma livre
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await pool.query("DELETE FROM posts WHERE id = ANY($1)", [createdIds]);
  await pool.end();
  server.close();
});

test("GET /posts lista os rascunhos filtrando por status", async () => {
  const draft = await createDraft();

  const { status, body } = await request("GET", "/posts?status=draft");

  assert.equal(status, 200);
  assert.ok(body.data.some((p) => p.id === draft.id));
  assert.ok(body.data.every((p) => p.status === "draft"));
});

test("GET /posts com status inválido devolve 400", async () => {
  const { status } = await request("GET", "/posts?status=xyz");
  assert.equal(status, 400);
});

test("GET /posts/:id devolve o post ou 404", async () => {
  const draft = await createDraft();

  const found = await request("GET", `/posts/${draft.id}`);
  assert.equal(found.status, 200);
  assert.equal(found.body.data.title, "Título de teste");

  const missing = await request("GET", "/posts/999999999");
  assert.equal(missing.status, 404);
});

test("PATCH approve aprova o rascunho e bloqueia uma segunda mudança", async () => {
  const draft = await createDraft();

  const approved = await request("PATCH", `/posts/${draft.id}/approve`);
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.status, "approved");

  const again = await request("PATCH", `/posts/${draft.id}/reject`);
  assert.equal(again.status, 409);
});

test("PATCH reject rejeita o rascunho", async () => {
  const draft = await createDraft();

  const { status, body } = await request("PATCH", `/posts/${draft.id}/reject`);

  assert.equal(status, 200);
  assert.equal(body.data.status, "rejected");
});

test("PATCH em post inexistente devolve 404", async () => {
  const { status } = await request("PATCH", "/posts/999999999/approve");
  assert.equal(status, 404);
});

test("POST /posts/draft valida o body antes de chamar a IA", async () => {
  const invalidJson = await request("POST", "/posts/draft", "{'idea':'x'}");
  assert.equal(invalidJson.status, 400);

  const shortIdea = await request("POST", "/posts/draft", '{"idea":"curta"}');
  assert.equal(shortIdea.status, 400);
});

test("rota desconhecida devolve 404", async () => {
  const { status } = await request("GET", "/nada");
  assert.equal(status, 404);
});

test("GET /openapi.json serve a especificação", async () => {
  const { status, body } = await request("GET", "/openapi.json");

  assert.equal(status, 200);
  assert.equal(body.openapi, "3.0.3");
  assert.ok(body.paths["/posts/draft"].post);
});

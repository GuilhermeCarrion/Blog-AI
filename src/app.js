import http from "node:http";
import { createPostDraft } from "./services/create-post-draft.js";
import { HttpError } from "./errors/http-error.js";
import { findPostById, listPosts } from "./repositories/posts-repository.js";
import { readJsonBody, sendJson } from "./http/helpers.js";
import { changePostStatus } from "./services/change-post-status.js";
import { openapi, swaggerHtml } from "./docs/openapi.js";

const VALID_STATUSES = ["draft", "approved", "rejected"];
const ACTION_ON_STATUS = { approve: "approved", reject: "rejected" };

export const server = http.createServer(async (req, res) => {
  try {
    const { method } = req;
    const { pathname, searchParams } = new URL(
      req.url,
      `http://${req.headers.host}`,
    );

    if (method === "GET" && pathname === "/openapi.json") {
      return sendJson(res, 200, openapi);
    }

    if (method === "GET" && pathname === "/docs") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(swaggerHtml);
    }

    // GET - /posts?status=draft
    if (method === "GET" && pathname === "/posts") {
      const status = searchParams.get("status");

      if (status && !VALID_STATUSES.includes(status)) {
        throw new HttpError(400, "Status inválido.");
      }

      const posts = await listPosts(status);
      return sendJson(res, 200, { data: posts });
    }

    // POST - /posts/draft
    if (method === "POST" && pathname === "/posts/draft") {
      const body = await readJsonBody(req);
      const post = await createPostDraft(body.idea);
      return sendJson(res, 201, { data: post });
    }

    // GET /posts/:id | PATCH /posts/:id/approve | PATCH /posts/:id/reject
    const match = pathname.match(/^\/posts\/(\d+)(?:\/(approve|reject))?$/);

    if (match) {
      const id = Number(match[1]);
      const action = match[2];

      if (!action && method === "GET") {
        const post = await findPostById(id);
        if (!post) throw new HttpError(404, "Post não encontrado");
        return sendJson(res, 200, { data: post });
      }

      if (action && method === "PATCH") {
        const post = await changePostStatus(id, ACTION_ON_STATUS[action]);
        return sendJson(res, 200, { data: post });
      }
    }

    throw new HttpError(404, "Rota não encontrada");
  } catch (e) {
    if (e instanceof HttpError) {
      return sendJson(res, e.statusCode, { message: e.message });
    }

    console.error(e); // o detalhe fica no log, sem vazar para o cliente
    return sendJson(res, 500, { message: "Erro interno do servidor" });
  }
});

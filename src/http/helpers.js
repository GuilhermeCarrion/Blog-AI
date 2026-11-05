import { HttpError } from "../errors/http-error.js";

export function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new HttpError(400, "O Body não é um JSON válido");
  }
}

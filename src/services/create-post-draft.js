import z from "zod";
import { HttpError } from "../errors/http-error.js";
import { writerAgent } from "../agents/writer-agent.js";
import { insertPost } from "../repositories/posts-repository.js";

const postSchema = z.object({
  title: z.string().min(5).max(120),
  content: z.string().min(100),
});

export async function createPostDraft(idea) {
  if (typeof idea !== "string" || idea.trim().length < 10) {
    throw new HttpError(400, "Envie uma 'ideia' com maior que 10 caracteres");
  }

  const result = await writerAgent.generate(
    `Escreva um post de blog sobre a seguinte ideia: ${idea}`,
    { structuredOutput: { schema: postSchema } },
  );

  const { title, content } = result.object;

  return insertPost({ idea: idea.trim(), title, content });
}

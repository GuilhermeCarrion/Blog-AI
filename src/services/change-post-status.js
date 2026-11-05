import { HttpError } from "../errors/http-error.js";
import {
  findPostById,
  updatePostStatus,
} from "../repositories/posts-repository.js";

export async function changePostStatus(idPost, newStatus) {
  const post = await findPostById(idPost);

  if (!post) throw new HttpError(404, "Nenhum post encontrado");

  if (post.status !== "draft")
    throw new HttpError(
      409,
      `Post já está '${post.status}'. Só rascunhos podem mudar de status`,
    );

  return updatePostStatus(idPost, newStatus);
}

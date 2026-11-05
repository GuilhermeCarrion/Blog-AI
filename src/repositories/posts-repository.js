import { pool } from "../database/connection.js";

export async function insertPost({ idea, title, content }) {
  const { rows } = await pool.query(
    `INSERT INTO posts (idea, title, content)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [idea, title, content],
  );
  return rows[0];
}

export async function listPosts(status) {
  if (status) {
    const { rows } = await pool.query(
      `SELECT * FROM posts WHERE status = $1 ORDER BY created_at DESC`,
      [status],
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT * FROM posts ORDER BY created_at DESC`,
  );
  return rows;
}

export async function findPostById(id) {
  const { rows } = await pool.query(`SELECT * FROM posts WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updatePostStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE posts
    SET status = $2, updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [id, status],
  );
  return rows[0];
}

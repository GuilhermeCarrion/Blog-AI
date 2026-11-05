import { server } from "./app.js";

const { API_PORT, API_HOST, API_PROTOCOL } = process.env;

server.listen(API_PORT, API_HOST, () => {
  console.log(`Server running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
  console.log(`Docs: ${API_PROTOCOL}://${API_HOST}:${API_PORT}/docs`);
});

import { Agent } from "@mastra/core/agent";
import { groq } from "@ai-sdk/groq";

export const writerAgent = new Agent({
  name: "writer-agent",
  instructions: `
  Você é um redator de blog técnico em português do Brasil.
    A partir de uma ideia, escreva:
    - um título claro e atrativo (máximo 80 caracteres);
    - um conteúdo em Markdown, com introdução, seções com subtítulos (##) e conclusão.
    Não invente dados, estatísticas ou citações.
  `,
  model: groq("openai/gpt-oss-120b"),
});

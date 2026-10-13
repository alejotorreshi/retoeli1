import { z } from "zod";
import type { ChatCompletion } from "@/llm/types/provider.type.ts";

const toolCallSchema = z.object({
  id: z.string(),
  function: z.object({ name: z.string(), arguments: z.string() }),
});

const choiceSchema = z.object({
  finish_reason: z.string().nullish(),
  message: z.object({
    content: z.string().nullish(),
    tool_calls: z.array(toolCallSchema).optional(),
    reasoning_content: z.string().nullish(),
  }),
});

const usageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  prompt_tokens_details: z.object({ cached_tokens: z.number().nullish() }).nullish(),
  prompt_cache_hit_tokens: z.number().nullish(),
});

export const chatCompletionSchema = z.object({
  model: z.string(),
  choices: z.array(choiceSchema),
  usage: usageSchema.nullish(),
}) satisfies z.ZodType<ChatCompletion>;

enum FireworksModel {
    Llama8B
}
import {} from "openai";
import { Chat } from "openai/resources/chat/chat";

export async function fireworksInference(
  modelId: FireworksModel,
  messages: Array<Chat.ChatCompletionMessageParam>,
  temperature: number = 0.9,
  stopTokens: string[] = [`</newStoryAddition>`, "}```", "}\n```"]
) {
  const url = `https://api.fireworks.ai/inference/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
    },

    body: JSON.stringify({
      model: modelId,
      messages: messages,
      stream: false,
      n: 1,
      top_p: 1,
      max_tokens: 1024,
      temperature: temperature,
      stop: stopTokens,
    }),
  });
  const chatCompletion = await response.json();
  return chatCompletion.choices[0].message.content!;
}

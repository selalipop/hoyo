import { BotCreationEvent } from "@/app/api/bot/botCreationEvent";
import { useEffect, useState } from "react";
import { useAsyncEffect } from "use-async-effect";
import { Button, Flex, TextField } from "@radix-ui/themes";

export async function* streamingFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): AsyncGenerator<T, void, unknown> {
  const response = await fetch(input, init);
  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    try {
      yield JSON.parse(decoder.decode(value)) as T;
    } catch (e: any) {
      console.warn(e.message);
    }
  }
}

export default function RenderStreamData() {
  const [faq, setFaq] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const [url, setUrl] = useState<any[]>([]);
  const [screenshot, setScreenshot] = useState<string>("");

  const handleSubmit = async () => {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const events = streamingFetch<BotCreationEvent>("/api/bot", {
      headers,
      method: "POST",
      body: JSON.stringify({
        url,
      }),
    });

    for await (const event of events) {
      console.log("New Bot Creation Event", event);
      if (event.type === "webpageScraped") {
        setScreenshot(event.screenshot);
      }
      if (event.type === "qaGenerated") {
        setFaq(event.qaPairs);
      }
    }
  };

  return (
    <div>
      <TextField.Root
        placeholder="Search the docs…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      ></TextField.Root>
      <Button onClick={handleSubmit}>Submit</Button>
      <img src={screenshot} />
      <Flex gap="2" direction={"column"}>
        {faq.map((pair) => (
          <div key={pair.question}>
            <h1>{pair.question}</h1>
            <p>{pair.answer}</p>
          </div>
        ))}
      </Flex>
    </div>
  );
}

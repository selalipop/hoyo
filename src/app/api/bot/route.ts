import { makeStream } from "@/util/makeStream";
import { BotCreationEvent } from "./botCreationEvent";
import { NextRequest } from "next/server";
import FireCrawlApp from "@mendable/firecrawl-js";
import { StreamingResponse } from "@/util/streamingResponse";
import { extractWebpageFaq } from "./extractFaq";
import { extractWebpageContent } from "./extractWebpageContent";

type Item = {
  key: string;
  value: string;
};
export const firecrawl = new FireCrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export const extractOutermostJSON = (input: string): string | null => {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}") + 1;
  return input.substring(start, end);
};

async function* createBot(
  url: string
): AsyncGenerator<BotCreationEvent, void, unknown> {
  const { pageContent, screenshot } = await extractWebpageContent(url);

  yield {
    type: "webpageScraped",
    content: pageContent,
    screenshot: screenshot,
    url: url,
  };

  console.log("scraping complete, extracting webpage FAQ", url);
  const faq = await extractWebpageFaq(pageContent);
  yield {
    type: "qaGenerated",
    siteSummary: faq.pageSummary,
    qaPairs: faq.qaPairs,
  };

  
}

export async function POST(req: NextRequest) {
  const bodyData = await req.json();

  const stream = makeStream(createBot(bodyData.url));
  const response = new StreamingResponse(stream);
  return response;
}

import { makeStream } from "@/util/makeStream";
import { BotCreationEvent } from "./botCreationEvent";
import { NextRequest } from "next/server";
import FireCrawlApp from "@mendable/firecrawl-js";
import { StreamingResponse } from "@/util/streamingResponse";

type Item = {
  key: string;
  value: string;
};
const firecrawl = new FireCrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export const extractOutermostJSON = (input: string): string | null => {
  const match = input.match(/{[^{}]*(?:{[^{}]*}[^{}]*)*}/);
  return match ? match[0].trim() : null;
};

async function storeWebpage() {
  await client.db("admin").command({ ping: 1 });
}

async function extractWebpageContent(url: string) {
    console.log(process.env.FIRECRAWL_API_KEY)
  const scrapeResult = await firecrawl.scrapeUrl(url, {
    pageOptions: {
      screenshot: true,
    },
  });
  console.log("Scrape Result", scrapeResult);
  return {
    pageContent: scrapeResult.data,
    screenshot: scrapeResult.data?.screenshot,
  };
}
/**
 * async generator that simulate a data fetch from external resource and
 * return chunck of data every second
 */
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
}

export async function POST(req: NextRequest) {
  const bodyData = await req.json();

  const stream = makeStream(createBot(bodyData.rootPage));
  const response = new StreamingResponse(stream);
  return response;
}

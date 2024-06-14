import { firecrawl } from "./route";

export async function extractWebpageContent(url: string) {
  console.log("Scraping URL", url);

  const scrapeResult = await firecrawl.scrapeUrl(url, {
    pageOptions: {
      screenshot: true,
    },
  });

  return {
    pageContent: scrapeResult.data.content,
    screenshot: scrapeResult.data?.metadata?.screenshot,
  };
}

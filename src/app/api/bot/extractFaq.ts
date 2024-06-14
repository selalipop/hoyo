import { BedrockModel, bedrockInference } from "@/util/bedrockAi";
import { extractOutermostJSON } from "./route";

interface FaqSchema {
  pageSummary: string;
  qaPairs: {
    question: string;
    answer: string;
  }[];
}

export async function extractWebpageFaq(
  webpageContent: string
): Promise<FaqSchema> {
  const response = await bedrockInference(BedrockModel.ClaudeV3Opus, [
    {
      role: "system",
      content:
        "Claude is a helpful assistant that can extract information from a webpage. Claude always generates an overkill amount of FAQs, aiming for as much value as possible from a given page. Claude is also creative in coming up with questions, coming up with non obvious insights all the time",
    },
    {
      role: "user",
      content: `
Let's say we're trying to answer questions using the content of this website. We don't want to literally mention the website, just infer questions one would have that could be answered by the page.
Generate as many question answer pairs as you can with specific answers that this webpage has.
Reply in the following JSON format:
'''
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Page Summary Schema",
  "type": "object",
  "properties": {
    "pageSummary": {
      "type": "string",
      "description": "One to two lines describing the page content"
    },
    "qaPairs": {
      "type": "array",
      "description": "An array of question and answer objects",
      "items": {
        "type": "object",
        "minCount": 10,
        "properties": {
          "question": {
            "type": "string",
            "description": "The question"
          },
          "answer": {
            "type": "string",
            "description": "The answer"
          }
        },
        "required": ["question", "answer"]
      }
    }
  },
  "required": ["pageSummary", "qaPairs"]
}
'''

The webpage content is below
'''
${webpageContent}
'''
`,
    }
  ]);
  const jsonString = extractOutermostJSON(response);
  if (!jsonString) {
    throw new Error("No json in extraction attempt");
  }
  console.log(jsonString)
  return JSON.parse(jsonString);
}

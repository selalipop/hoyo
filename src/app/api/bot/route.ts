import { makeStream } from "@/util/makeStream";
import { BotCreationEvent } from "./botCreationEvent";
import { NextRequest } from "next/server";
import FireCrawlApp from "@mendable/firecrawl-js";
import { StreamingResponse } from "@/util/streamingResponse";
import { extractWebpageFaq } from "./extractFaq";
import { extractWebpageContent } from "./extractWebpageContent";
import connectDB from "@/backend/connectDb";
import { CustomerAccount, FaqInstance } from "@/backend/models";
import normalizeUrl from "normalize-url";
import mongoose from "mongoose";

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

  // Check if both start and end are valid indices
  if (start === -1 || end === 0) {
    return null;
  }

  return input.substring(start, end);
};

async function getFaqInstancesForCompany(companyId: mongoose.Types.ObjectId) {
  try {
    // Populate the customer account information in the FAQ instances
    const faqInstances = await FaqInstance.find({ customerAccount: companyId })
      .populate("customerAccount", "name website")
      .exec();

    return faqInstances;
  } catch (error) {
    console.error("Error getting FAQ instances for company:", error);
    throw error;
  }
}
async function* createBot(
  url: string
): AsyncGenerator<BotCreationEvent, void, unknown> {
  url = normalizeUrl(url);
  const { pageContent, screenshot } = await extractWebpageContent(url);
  await connectDB();

  const existingCustomer = await CustomerAccount.findOne({ website: url });
  if (existingCustomer) {
    yield {
      type: "phoneNumberAssigned",
      phoneNumber: existingCustomer.phoneNumber,
    };
  }
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
  const { customer } = await createOrFindCustomerAccount(url);
  await Promise.all(
    faq.qaPairs.map(async (pair) => {
      const faqInstance = new FaqInstance({
        question: pair.question,
        answer: pair.answer,
        customerAccount: customer.id,
      });
      await faqInstance.save();
    })
  );
  if (!customer.phoneNumber) {
    const number = await buyNumber()
    console.log("number", number)
    customer.phoneNumber = number.number
    await customer.save()
  }
  yield {
    type: "phoneNumberAssigned",
    phoneNumber: customer.phoneNumber,
  };
}
async function buyNumber() {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOCODE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: '{"area_code":"415","telephony_provider":"vonage"}',
  };

  return (await fetch("https://api.vocode.dev/v1/numbers/buy", options).then(
    (response) => response.json()
  )) as {
    number: string;
  };
}
async function createOrFindCustomerAccount(url: string) {
  try {
    // Use findOneAndUpdate to find a document, or insert if it doesn't exist
    const customer = await CustomerAccount.findOneAndUpdate(
      { website: url }, // Search condition
      { website: url }, // Data to update or insert
      { new: true, upsert: true } // Options: return the new doc if created
    );

    // The created field indicates whether the document was newly created
    const created = !customer._id; // This check is simplified for logic purposes

    // Return the customer account and a boolean indicating if it was created
    return { customer, created };
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error creating or finding customer account:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const bodyData = await req.json();

  const stream = makeStream(createBot(bodyData.url));
  const response = new StreamingResponse(stream);
  return response;
}

import connectDB from "@/backend/connectDb";
import {
  CustomerAccount,
  FaqInstance,
  ICustomerAccount,
  IFaqInstance,
} from "@/backend/models";

export const dynamic = "force-dynamic"; // defaults to auto

const fetchCall = async (id: string) => {
  const url = `https://api.vocode.dev/v1/calls?id=${id}`;
  const token = process.env.VOCODE_API_KEY; // replace with your actual token

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.agent_phone_number;
};

export async function POST(request: Request) {
  await connectDB();
  const body: {
    call_id: string;
    payload: {
      query: string;
    };
  } = await request.json();
  console.log("Call request ", body);
  const {
    payload: { query },
    call_id: callId,
  } = body;
  const phoneNumber = await fetchCall(callId);
  console.log("Found phone number as ", phoneNumber);
  const customer: ICustomerAccount | null = await CustomerAccount.findOne({
    phoneNumber,
  });
  console.log("Found customer as ", customer);
  if (!customer) {
    return Response.json({ success: false });
  }
  const faqs: IFaqInstance[] = await FaqInstance.find({
    customerAccount: customer.id,
  });
  console.log(
    "FAQ",
    faqs.map((faq) => {
      return `Q: ${faq.question}, A:${faq.answer}`;
    })
  );
  return Response.json({
    result: {
      success: true,
      information: `
  Found the following information:
  ${faqs
    .map((faq) => {
      return `Q: ${faq.question}, A:${faq.answer}`;
    })
    .join("\n")}
  `,
    },
  });
}

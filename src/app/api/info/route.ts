export const dynamic = "force-dynamic"; // defaults to auto
export async function GET(request: Request) {
  const body = await request.json();
  const { phoneNumber } = body;
  const customer = await CustomerAccount.findOne({ phoneNumber });
  return Response.json({ success: true });
}

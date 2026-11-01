// expect: NX-ZOD-05
export async function GET() { return Response.json({ url: process.env.WEBHOOK_URL }); }

import { getCabins } from "@/app/_lib/data-service";

export async function GET() {
  const cabins = await getCabins();

  try {
    return Response.json(cabins);
  } catch {
    return Response.json({ message: "there was an error getting cabins" });
  }
}

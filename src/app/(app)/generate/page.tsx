import { GenerateView } from "@/components/generate-view";

export const metadata = { title: "Create — Music AI" };

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { prompt } = await searchParams;
  return <GenerateView initialPrompt={typeof prompt === "string" ? prompt : ""} />;
}

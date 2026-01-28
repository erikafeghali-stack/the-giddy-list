import { redirect } from "next/navigation";

export default async function ShortlistShortUrl({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/shortlist/${slug}`);
}

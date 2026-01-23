import { redirect } from "next/navigation";

export default async function ShortRegistryRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/registry/${slug}`);
}

import { notFound } from "next/navigation";
import { getCoupleForTheme } from "@/lib/theme/queries";
import { getStoryFrameCounts } from "@/lib/theme/frame-counter";
import { getTheme } from "@/themes/registry";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PreviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "home",
  "settings",
  "subscribe",
  "api",
  "_next",
]);

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    return {};
  }

  const couple = await getCoupleForTheme(slug);

  if (!couple) {
    return {
      title: "Page Not Found",
    };
  }

  const title = `${couple.male_name} & ${couple.female_name}`;
  const description = "Our story together";
  // Gunakan placeholder atau dynamic OG image service jika ada
  // Untuk sekarang kita pakai default placeholder atau construct URL
  const publicUrl = `https://domain.com/${slug}`; // Sesuaikan domain asli nanti

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: publicUrl,
      images: [
        {
          url: "https://placehold.co/1200x630/png?text=Our+Story", // Placeholder
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  // Fetch data using dedicated theme query
  const data = await getCoupleForTheme(slug);

  if (!data) {
    notFound();
  }

  // Fallback theme if null (support legacy data)
  const themeCode = data.theme_code || "aether";
  const theme = await getTheme(themeCode);

  if (!theme) {
    notFound();
  }

  try {
    const { default: ThemePreview } = await import(
      `@/themes/${theme.code}/Preview`
    );
    const frameCounts = await getStoryFrameCounts(theme.code);
    return <ThemePreview data={data} frameCounts={frameCounts} />;
  } catch (error) {
    console.error(`[PreviewPage] Failed to load theme: ${theme.code}`, error);
    notFound();
  }
}

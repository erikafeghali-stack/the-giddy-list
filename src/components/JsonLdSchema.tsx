import { GiftGuide, Product } from "@/lib/types";

interface JsonLdSchemaProps {
  guide: GiftGuide;
  products: Array<Product & { ai_description?: string | null }>;
}

export default function JsonLdSchema({ guide, products }: JsonLdSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thegiddylist.com";

  // ItemList schema for the gift guide
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: guide.title,
    description: guide.meta_description || guide.intro_content?.slice(0, 160),
    url: `${baseUrl}/guides/${guide.slug}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.title,
        description: product.ai_description || product.description,
        url: product.original_url,
        image: product.image_url,
        ...(product.price && {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }),
        ...(product.brand && {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }),
        ...(product.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            ...(product.review_count && {
              reviewCount: product.review_count,
            }),
          },
        }),
      },
    })),
  };

  // Article schema for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.meta_description || guide.intro_content?.slice(0, 160),
    url: `${baseUrl}/guides/${guide.slug}`,
    datePublished: guide.published_at || guide.created_at,
    dateModified: guide.updated_at,
    publisher: {
      "@type": "Organization",
      name: "The Giddy List",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/guides/${guide.slug}`,
    },
    ...(guide.cover_image_url && {
      image: guide.cover_image_url,
    }),
    keywords: guide.keywords?.join(", "),
    articleSection: guide.category || "Gift Guides",
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Gift Guides",
        item: `${baseUrl}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${baseUrl}/guides/${guide.slug}`,
      },
    ],
  };

  // FAQ schema for common gift guide questions (optional, improves SEO)
  const faqSchema = guide.age_range
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What are the best gifts for ${guide.age_range} year olds?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: guide.intro_content || guide.meta_description || `Check out our curated ${guide.title} for top gift recommendations.`,
            },
          },
        ],
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}

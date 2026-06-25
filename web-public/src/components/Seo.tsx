import { Helmet } from "react-helmet-async";

import type { SeoMeta } from "../lib/api";

interface Props {
  seo: Partial<SeoMeta> & { title: string };
  jsonLd?: object[];
}

/** Đẩy thẻ SEO + Open Graph + JSON-LD vào <head> để bot đọc được. */
export default function Seo({ seo, jsonLd }: Props) {
  const robots = seo.robots ?? "index,follow";
  return (
    <Helmet>
      <title>{seo.title}</title>
      {seo.description && (
        <meta name="description" content={seo.description} />
      )}
      <meta name="robots" content={robots} />
      {seo.canonical_url && <link rel="canonical" href={seo.canonical_url} />}

      <meta property="og:type" content="article" />
      <meta property="og:title" content={seo.og_title ?? seo.title} />
      {(seo.og_description ?? seo.description) && (
        <meta
          property="og:description"
          content={seo.og_description ?? seo.description ?? ""}
        />
      )}
      {seo.og_image && <meta property="og:image" content={seo.og_image} />}
      <meta name="twitter:card" content="summary_large_image" />

      {jsonLd?.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

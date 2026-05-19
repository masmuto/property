import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default metadata fallback
const defaultMetadata: Metadata = {
  title: "PropMart - Temukan Properti Impian Anda",
  description:
    "Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.",
  keywords: [
    "PropMart",
    "properti",
    "jual beli rumah",
    "apartemen",
    "tanah",
    "ruko",
    "Indonesia",
    "real estate",
    "KPR",
  ],
  authors: [{ name: "PropMart" }],
  openGraph: {
    title: "PropMart - Temukan Properti Impian Anda",
    description:
      "Jual beli properti terpercaya di seluruh Indonesia.",
    type: "website",
    siteName: "PropMart",
    images: [
      {
        url: "/properties/hero-banner.png",
        width: 1200,
        height: 630,
        alt: "PropMart - Temukan Properti Impian Anda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PropMart - Temukan Properti Impian Anda",
    description: "Jual beli properti terpercaya di seluruh Indonesia.",
    images: ["/properties/hero-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Dynamic metadata generation from database
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { db } = await import('@/lib/db')
    const seo = await db.seoSetting.findUnique({ where: { id: 'main' } })

    if (!seo) return defaultMetadata

    const keywords = seo.keywords
      ? seo.keywords.split(',').map((k) => k.trim())
      : defaultMetadata.keywords as string[]

    const isNoIndex = seo.robots.includes('noindex')
    const isNoFollow = seo.robots.includes('nofollow')

    const metadataObj: Metadata = {
      title: seo.title || defaultMetadata.title,
      description: seo.description || defaultMetadata.description,
      keywords,
      authors: [{ name: seo.siteName || 'PropMart' }],
      openGraph: {
        title: seo.title || defaultMetadata.title as string,
        description: seo.description || defaultMetadata.description as string,
        type: "website",
        siteName: seo.siteName || "PropMart",
        images: seo.ogImage
          ? [
              {
                url: seo.ogImage,
                width: 1200,
                height: 630,
                alt: seo.title || "PropMart",
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title || defaultMetadata.title as string,
        description: seo.description || defaultMetadata.description as string,
        images: seo.ogImage ? [seo.ogImage] : undefined,
      },
      robots: {
        index: !isNoIndex,
        follow: !isNoFollow,
      },
    }

    if (seo.canonicalUrl) {
      metadataObj.alternates = {
        canonical: seo.canonicalUrl,
      }
    }

    if (seo.googleVerification) {
      metadataObj.verification = {
        google: seo.googleVerification,
      }
    }

    return metadataObj
  } catch {
    return defaultMetadata
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for Real Estate */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "PropMart",
              description: "Jual beli properti terpercaya di seluruh Indonesia",
              url: "https://propmart.id",
              areaServed: "Indonesia",
              knowsLanguage: ["id", "en"],
              makesOffer: {
                "@type": "Offer",
                itemOffered: {
                  "@type": "RealEstateListing",
                  name: "Properti Indonesia",
                },
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200 text-foreground`}
      >
        <Providers>
          <div className="mobile-shell">
            <div className="mobile-container">
              {children}
            </div>
          </div>
          <Toaster richColors position="top-center" className="mobile-toast" />
        </Providers>
      </body>
    </html>
  );
}

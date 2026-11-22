import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { jsonLd as safeJson } from "@/lib/jsonld";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

const display = Montserrat({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-montserrat", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Visual Graf · Bolsas personalizadas con tu logo",
    template: "%s · Visual Graf",
  },
  description: site.description,
  applicationName: site.displayName,
  keywords: [
    "bolsas personalizadas",
    "bolsas con logo",
    "bolsas impresas",
    "bolsas manija riñón",
    "bolsas para ecommerce",
    "bolsas para hielo",
    "serigrafía",
    "packaging",
    "bolsas para comercios",
    "Argentina",
  ],
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.displayName,
    title: "Visual Graf · Tu marca, en cada bolsa",
    description: site.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.displayName,
  slogan: "Tu bolsa impresa",
  url: site.url,
  logo: `${site.url}/img/logo-512.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+${site.whatsapp}`,
    contactType: "sales",
    areaServed: "AR",
    availableLanguage: "es",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={safeJson(jsonLd)} />
        <CartProvider>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

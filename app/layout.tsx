import type { Metadata } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

// The whole tree reads from the database per request; opting out of static
// prerendering keeps `next build` independent of a running database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "خطار | السياحة والدراسة بالخارج",
    template: "%s | خطار",
  },
  description:
    "منصة خطار للسياحة والسفر: برامج سياحية داخلية وخارجية، جداول رحلات مخصصة، وبرامج دراسة اللغة والابتعاث مع تسهيل إجراءات القبول.",
  openGraph: {
    locale: "ar_SA",
    type: "website",
    siteName: "خطار",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
        <Toaster position="bottom-left" dir="rtl" />
      </body>
    </html>
  );
}

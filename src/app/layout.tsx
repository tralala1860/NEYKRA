import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { ThemeProvider } from "@/lib/theme";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEYKRA",
  description: "NEYKRA — réseau social manga/anime, gratuit et communautaire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
      data-theme="shonen"
      data-mode="dark"
    >
      <body className="min-h-full flex flex-col">
        <SupabaseProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

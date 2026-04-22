import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import PageLoader from "@/components/ui/PageLoader";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextFlow - Nodes Editor",
  description: "Pixel-Perfect Krea Nodes Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" suppressHydrationWarning>
        <head>
          {/* Inline script — sets theme BEFORE first paint to prevent flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var t = localStorage.getItem('nextflow-theme');
                    if (t === 'light') {
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  } catch(e) {}
                })();
              `,
            }}
          />
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <ThemeProvider>
            <PageLoader />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

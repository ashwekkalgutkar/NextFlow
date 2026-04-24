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
  icons: {
    icon: [
      { url: "https://plain-apac-prod-public.komododecks.com/202604/23/TsmJGprgy6IEM9moJhsX/image.png", media: "(prefers-color-scheme: light)" },
      { url: "https://plain-apac-prod-public.komododecks.com/202604/23/KVDPGqHxpZk38VsRrw63/image.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
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
          {/* Direct link tags for favicon to ensure immediate updates */}
          <link rel="icon" href="https://plain-apac-prod-public.komododecks.com/202604/23/TsmJGprgy6IEM9moJhsX/image.png" media="(prefers-color-scheme: light)" />
          <link rel="icon" href="https://plain-apac-prod-public.komododecks.com/202604/23/KVDPGqHxpZk38VsRrw63/image.png" media="(prefers-color-scheme: dark)" />
          {/* Fallback for manual theme switching (browsers will pick the first one) */}
          <link rel="icon" href="https://plain-apac-prod-public.komododecks.com/202604/23/KVDPGqHxpZk38VsRrw63/image.png" />
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

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../../context/theme-provider";
import SessionProviderWrapper from "@/features/core/lib/session-provider";
import { quicksand } from "@/fonts/quicksand";
import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "Eminent Defence Academy",
  description: "Physical & education Training Institute for Pre-Recruitment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProviderWrapper>
            {children}
            <Toaster />
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

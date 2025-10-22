import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientAuthProvider } from '@/components/ClientAuthProvider';
import { SessionChip } from '@/components/SessionChip';
import { StudentSelector } from '@/components/StudentSelector';
import { StudentProvider } from '@/contexts/StudentContext';
import NavTabs from '@/components/NavTabs';
import { RadialSection } from '@/components/RadialSection';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Checkpoint",
  description: "Student data management system",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <ClientAuthProvider>
          <StudentProvider>
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center py-4">
                    <div className="flex flex-col">
                      <h1 className="text-xl font-semibold text-gray-900">Checkpoint</h1>
                      <div className="mt-2">
                        <StudentSelector />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <SessionChip />
                    </div>
                  </div>
                  {/* Radial div with real data from selectors */}
                  <RadialSection />
                  
                  <div className="border-t border-gray-200 pt-4">
                    <NavTabs />
                  </div>
                </div>
              </header>
              
              <main>
                {children}
              </main>
            </div>
          </StudentProvider>
        </ClientAuthProvider>
        {/* Portal root for modals - positioned at document body level with max z-index */}
        <div id="portal-root" />
      </body>
    </html>
  );
}

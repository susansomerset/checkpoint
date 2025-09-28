import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientAuthProvider } from '@/components/ClientAuthProvider';
import { SessionChip } from '@/components/SessionChip';
import { StudentSelector } from '@/components/StudentSelector';
import { StudentProvider } from '@/contexts/StudentContext';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      <body
        className={`${inter.variable} antialiased`}
      >
        <ClientAuthProvider>
          <StudentProvider>
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                      <h1 className="text-xl font-semibold text-gray-900">Checkpoint</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                      <StudentSelector />
                      <SessionChip />
                    </div>
                  </div>
                </div>
              </header>
              <main>
                {children}
              </main>
            </div>
          </StudentProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
}

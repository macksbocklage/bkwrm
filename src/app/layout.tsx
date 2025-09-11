import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

// Force dynamic rendering to prevent prerendering issues with Clerk
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BKWRM",
  description: "talk to your books.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is properly configured
  const isClerkConfigured = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.CLERK_SECRET_KEY
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {isClerkConfigured ? (
          <ClerkProvider>
            {children}
          </ClerkProvider>
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Configuration Required
              </h1>
              <p className="text-gray-600 mb-4">
                Please set up your Clerk environment variables to use this application.
              </p>
              <div className="text-sm text-gray-500">
                <p>Required variables:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
                  <li>CLERK_SECRET_KEY</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'MyNextAnime - Anime Recommender',
  description: 'AI-powered anime recommendation site — describe a mood or genre, get matched anime with posters, ratings, and a personal watchlist.',
  openGraph: {
    title: 'MyNextAnime - Anime Recommender',
    description: 'AI-powered anime recommendation site — describe a mood or genre, get matched anime with posters, ratings, and a personal watchlist.',
    siteName: 'MyNextAnime',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

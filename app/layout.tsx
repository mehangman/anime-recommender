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
  metadataBase: new URL('https://mynextanime-ai.vercel.app'),
  title: 'Anime Recommender | AI Chatbot - MyNextAnime',
  description: 'Discover your next favorite anime with MyNextAnime! Chat with our intelligent AI to get highly personalized anime recommendations, track your watchlist, and explore ratings.',
  keywords: ['anime', 'anime recommender', 'AI chatbot', 'anime list', 'MyNextAnime', 'anime suggestions', 'MyAnimeList', 'otaku guide'],
  authors: [{ name: 'Shashank' }],
  creator: 'Shashank',
  openGraph: {
    title: 'Anime Recommender | AI Chatbot - MyNextAnime',
    description: 'Chat with our AI to get highly personalized anime recommendations based on your mood, genre, and taste. Track your watchlist seamlessly!',
    url: 'https://mynextanime-ai.vercel.app',
    siteName: 'MyNextAnime',
    images: [
      {
        url: '/assets/images/logo.png',
        width: 800,
        height: 600,
        alt: 'MyNextAnime AI Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anime Recommender | AI Chatbot - MyNextAnime',
    description: 'Discover your next favorite anime! Chat with our AI to get highly personalized recommendations based on your mood.',
    images: ['/assets/images/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MyNextAnime',
  alternateName: 'Anime Recommender AI Chatbot',
  url: 'https://mynextanime-ai.vercel.app/',
  description: 'AI-powered anime recommendation site — describe a mood or genre, get matched anime with posters, ratings, and a personal watchlist.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

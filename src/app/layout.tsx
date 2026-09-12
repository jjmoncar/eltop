import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'eltop.lat — El Leaderboard de Subasta para Startups, SaaS y Proyectos de LATAM',
  description:
    'El escaparate más codiciado de América Latina. Compite por el podio de tu industria (SaaS, Cripto, E-commerce, Marketing) mediante subasta continua y capta miles de clics verificados.',
  keywords: [
    'leaderboard latam',
    'saas latinoamerica',
    'startups latam',
    'cripto latam',
    'subasta de publicidad',
    'outbid latam',
    'eltop lat',
    'trafico tech latam',
  ],
  authors: [{ name: 'eltop.lat Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://eltop.lat'),
  openGraph: {
    title: 'eltop.lat — El Leaderboard de Subasta para LATAM',
    description:
      'Lidera el ranking de tu industria en América Latina. Subasta en vivo con pagos en Pix y PayPal.',
    url: 'https://eltop.lat',
    siteName: 'eltop.lat',
    locale: 'es_LA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eltop.lat — Leaderboard de Pago / Subasta para LATAM',
    description:
      'Lidera el ranking de tu industria en América Latina con subasta continua y tracking de clics.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-[#E05A38]/20 selection:text-[#CD4C29]">
        {children}
      </body>
    </html>
  );
}

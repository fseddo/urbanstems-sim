import type { Metadata } from 'next';
import { Mulish, Crimson_Text } from 'next/font/google';
import './globals.css';

const mulish = Mulish({
  variable: '--font-mulish',
  subsets: ['latin'],
});

const crimsonText = Crimson_Text({
  variable: '--font-crimson',
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UrbanStems | Online Flower Delivery  | UrbanStems',
  description:
    'Send fresh flowers today! Online flower delivery is quick and easy at UrbanStems. Explore our modern bouquets designed by real in-house florists!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}

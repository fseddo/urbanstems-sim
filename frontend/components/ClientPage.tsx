'use client';

import { useRef } from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { HomeContent } from '@/components/HomeContent';
import { Occasion, Product } from '@/types/api';

interface ClientPageProps {
  occasions: Occasion[];
  flowers: Product[];
  plants: Product[];
}

export const ClientPage = ({ occasions, flowers, plants }: ClientPageProps) => {
  const navbarRef = useRef<HTMLElement>(null);

  return (
    <div>
      <Navbar ref={navbarRef} />
      <main>
        <HomeContent
          navbarRef={navbarRef}
          occasions={occasions}
          flowers={flowers}
          plants={plants}
        />
      </main>
      <Footer />
    </div>
  );
};

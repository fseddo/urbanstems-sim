'use client';

import { useRef } from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { HomeContent } from '@/components/HomeContent';
import { Occasion } from '@/types/api';

interface ClientPageProps {
  occasions: Occasion[];
}

export const ClientPage = ({ occasions }: ClientPageProps) => {
  const navbarRef = useRef<HTMLElement>(null);

  return (
    <div>
      <Navbar ref={navbarRef} />
      <main>
        <HomeContent navbarRef={navbarRef} occasions={occasions} />
      </main>
      <Footer />
    </div>
  );
};

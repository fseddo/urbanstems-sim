'use client';

import { Footer } from '@/components/Footer';
import HomeContent from '@/components/HomeContent';
import { Navbar } from '@/components/navbar/Navbar';
import { useRef } from 'react';

export default function Home() {
  const navbarRef = useRef<HTMLElement>(null);

  return (
    <div>
      <Navbar ref={navbarRef} />
      <main>
        <HomeContent navbarRef={navbarRef} />
      </main>
      <Footer />
    </div>
  );
}

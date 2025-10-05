'use client';

import { useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/navbar/Navbar';
import { Category, Product } from '@/types/api';
import { HomeContent } from '@/components/HomeContent';

const Home = ({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) => {
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
};

// export async function getServerSideProps() {
//   try {
//     const [productsResponse, categories] = await Promise.all([
//       apiClient.getProducts({ ordering: '-created_at' }),
//       apiClient.getCategories(),
//     ]);

//     const products = productsResponse.results;
//     return {
//       props: {
//         products,
//         categories,
//         lastUpdated: new Date().toISOString(),
//       },
//     };
//   } catch (error) {
//     return {
//       props: {
//         products: [],
//         categories: [],
//         error,
//       },
//     };
//   }
// }

export default Home;

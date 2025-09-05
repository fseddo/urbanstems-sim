import { apiClient } from '@/lib/api';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { HomeContent } from '@/components/HomeContent';
import { Category, Product } from '@/types/api';

const Home = ({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) => {
  return (
    <div className='min-h-screen'>
      <Navbar />
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='min-h-0 overflow-y-scroll'>
          <div className='h-[2000px]'>
            {/* <HomeContent products={products} categories={categories} /> */}
          </div>
        </div>
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

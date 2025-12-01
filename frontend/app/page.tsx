import { ClientPage } from '@/components/ClientPage';
import { apiClient } from '@/lib/api';

export default async function Home() {
  const occasions = (await apiClient.getOccasions()).results;
  const flowers = (
    await apiClient.getProducts({
      category: 'flowers',
      sortKey: 'reviews_rating',
      sortOrder: 'asc',
    })
  ).results;
  const plants = (
    await apiClient.getProducts({
      category: 'plants',
      sortKey: 'reviews_rating',
      sortOrder: 'asc',
    })
  ).results;

  return <ClientPage occasions={occasions} flowers={flowers} plants={plants} />;
}

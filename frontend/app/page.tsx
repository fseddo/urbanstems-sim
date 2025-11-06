import { ClientPage } from '@/components/ClientPage';
import { apiClient } from '@/lib/api';

export default async function Home() {
  const occasions = (await apiClient.getOccasions()).results;

  return <ClientPage occasions={occasions} />;
}

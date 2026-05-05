import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/src/landing/HomePage';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: () => {
    document.title = 'UrbanStems | Online Flower Delivery';
  },
});

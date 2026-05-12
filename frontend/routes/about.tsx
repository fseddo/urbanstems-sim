import { createFileRoute } from '@tanstack/react-router';
import { AboutPage } from '@/src/about/AboutPage';

export const Route = createFileRoute('/about')({
  component: AboutPage,
  loader: () => {
    document.title = 'About Us | UrbanStems';
  },
});

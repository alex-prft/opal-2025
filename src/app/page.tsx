import ModernHomepage from '@/components/ModernHomepage';
import { generatePageMetadata } from '@/lib/utils/page-titles';

export const metadata = generatePageMetadata({
  pageTitle: 'Home',
  description: 'AI-powered strategy assistant for Optimizely DXP customers. Get data-driven insights, personalized recommendations, and strategic roadmaps.'
});

export default function Home() {
  return <ModernHomepage />;
}

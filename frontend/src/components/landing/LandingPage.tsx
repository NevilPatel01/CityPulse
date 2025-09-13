import { Header, Footer } from '../layout';
import { Hero, FeatureGrid, CTASection } from '../sections';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-base text-primary'>
      <Header />
      
      <main>
        <Hero />
        <FeatureGrid />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

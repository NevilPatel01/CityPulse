import { useEffect } from 'react';
import { Header, Footer } from '../layout';
import { Hero, FeatureGrid, CTASection } from '../sections';

export default function LandingPage() {
  useEffect(() => {
    // Set page title and meta description for accessibility
    document.title = 'CityPulse - Discover Cities Like a Local';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'CityPulse connects travelers with locals for authentic city experiences. Get real recommendations, find travel buddies, and explore hidden gems that only locals know.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'CityPulse connects travelers with locals for authentic city experiences. Get real recommendations, find travel buddies, and explore hidden gems that only locals know.';
      document.head.appendChild(meta);
    }

    // Add page load announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'CityPulse homepage loaded. Discover cities like a local.';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 2000);

    return () => {
      document.title = 'CityPulse';
    };
  }, []);

  return (
    <div className='min-h-screen bg-base text-primary'>
      <Header />
      
      <main id="main-content" role="main">
        {/* Page heading for screen readers */}
        <h1 className="sr-only">CityPulse - Travel Social Network Platform</h1>
        
        <Hero />
        <FeatureGrid />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

import './LandingPage.css';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header />
      <main className="landing-main">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

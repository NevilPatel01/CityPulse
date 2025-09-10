import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left Column - Text */}
        <div className="hero-content">
          <h1 className="hero-title">
            Discover cities like a{" "}
            <span className="hero-title-accent">local</span>
          </h1>
          <p className="hero-description">
            Get authentic recommendations from people who know the city 
            best. Skip the tourist traps and experience the real culture.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="hero-btn hero-btn-primary">
              Join CityPulse
            </a>
            <a href="#demo" className="hero-btn hero-btn-secondary">
              Watch Demo
            </a>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop&crop=center"
            alt="City street scene"
          />
          
          {/* Floating elements */}
          <div className="hero-floating-badge hero-badge-1">
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--primary)',
              borderRadius: '50%'
            }}></div>
            <span className="hero-badge-text">Local insights</span>
          </div>
          <div className="hero-floating-badge hero-badge-2">
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--primary)',
              borderRadius: '50%'
            }}></div>
            <span className="hero-badge-text">Real-time</span>
          </div>
          <div className="hero-floating-badge hero-badge-3">
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--accent)',
              borderRadius: '50%'
            }}></div>
            <span className="hero-badge-text">Authentic</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

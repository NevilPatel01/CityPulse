import { MapPin, Users, Clock, ShieldCheck, Globe, Heart } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Local Expertise",
      description: "Recommendations from verified locals who know their cities inside out."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a global community of travelers and locals sharing authentic experiences."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get the latest insights on what's happening right now in your destination."
    },
    {
      icon: ShieldCheck,
      title: "Verified Reviews",
      description: "Trust authentic reviews from real people, not fake accounts or bots."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Discover hidden gems in cities across 50+ countries worldwide."
    },
    {
      icon: Heart,
      title: "Personalized",
      description: "Get recommendations tailored to your interests and travel style."
    }
  ];

  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">
            Why travelers choose{' '}
            <span style={{color: 'var(--primary)'}}>CityPulse</span>
          </h2>
          <p className="features-subtitle">
            Experience cities through the eyes of locals with our
            community-driven platform
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <IconComponent />
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

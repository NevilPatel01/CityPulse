import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent } from '../components/ui/card';

const AboutPage = () => {
  const values = [
    {
      title: 'Authenticity First',
      description:
        'We believe in real experiences from real people. No fake reviews, no tourist traps - just honest recommendations from locals who know their cities best.',
    },
    {
      title: 'Community Driven',
      description:
        'CityPulse thrives because of our amazing community. Every recommendation, every connection, every discovery happens because people choose to share and help each other.',
    },
    {
      title: 'Cultural Respect',
      description:
        'We promote responsible tourism that respects local cultures, supports local businesses, and creates positive impact in the communities we visit.',
    },
    {
      title: 'Global Connection',
      description:
        "Travel breaks down barriers. We're building a platform where cultural exchange and genuine human connections happen naturally through shared experiences.",
    },
  ];

  return (
    <div className='min-h-screen bg-base text-primary'>
      <Header />

      <main>
        {/* Hero Section */}
        <section className='py-20 lg:py-32 px-4'>
          <div className='container mx-auto text-center'>
            <h1 className='text-4xl lg:text-6xl font-bold text-primary mb-6 leading-tight'>
              About <span className='text-pulse'>CityPulse</span>
            </h1>
            <p className='text-xl text-muted mb-8 leading-relaxed max-w-4xl mx-auto'>
              We're on a mission to transform how people discover cities by
              connecting travelers with locals who know the hidden gems,
              authentic experiences, and real culture that makes each
              destination special.
            </p>
            <div className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-2xl p-8 max-w-4xl mx-auto'>
              <h2 className='text-2xl font-semibold text-primary mb-4'>
                Our Story
              </h2>
              <p className='text-muted leading-relaxed text-lg'>
                CityPulse was born from a simple frustration: tired of tourist
                traps and generic travel guides, our founders wanted to
                experience cities the way locals do. After countless
                conversations with locals in coffee shops, bars, and street
                corners around the world, we realized there had to be a better
                way to connect authentic local knowledge with curious travelers.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
          <div className='container mx-auto'>
            <div className='grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto'>
              <Card className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass'>
                <CardContent className='p-8'>
                  <h3 className='text-2xl font-bold text-primary mb-4'>
                    Our Mission
                  </h3>
                  <p className='text-muted leading-relaxed text-lg'>
                    To democratize local knowledge and create meaningful
                    connections between travelers and locals, making authentic
                    travel experiences accessible to everyone while supporting
                    local communities.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass'>
                <CardContent className='p-8'>
                  <h3 className='text-2xl font-bold text-primary mb-4'>
                    Our Vision
                  </h3>
                  <p className='text-muted leading-relaxed text-lg'>
                    A world where every traveler can experience destinations
                    like a local, where cultural exchange happens naturally, and
                    where tourism creates positive impact for local communities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className='py-20 px-4'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Our Values
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                These principles guide everything we do at CityPulse
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-8 max-w-6xl mx-auto'>
              {values.map((value, index) => (
                <Card
                  key={index}
                  className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass hover:shadow-lg transition-shadow duration-300'
                >
                  <CardContent className='p-6'>
                    <h3 className='text-xl font-semibold text-primary mb-3'>
                      {value.title}
                    </h3>
                    <p className='text-muted leading-relaxed'>
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className='py-20 px-4'>
          <div className='container mx-auto text-center'>
            <Card className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass p-8 lg:p-12 max-w-4xl mx-auto'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Get In Touch
              </h2>
              <p className='text-muted text-lg mb-8 max-w-2xl mx-auto'>
                Have questions, feedback, or want to partner with us? We'd love
                to hear from you.
              </p>
              <div className='grid md:grid-cols-3 gap-8'>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Email</h4>
                  <p className='text-muted'>hello@citypulse.com</p>
                </div>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Support</h4>
                  <p className='text-muted'>support@citypulse.com</p>
                </div>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Press</h4>
                  <p className='text-muted'>press@citypulse.com</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;

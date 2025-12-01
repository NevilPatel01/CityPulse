import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-base text-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6 md:p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none space-y-6 text-muted">
            <p className="text-sm text-muted/80">Last Updated: December 2025</p>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using CityPulse (the "Service"), you accept and agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">2. Description of Service</h2>
              <p>
                CityPulse is a travel social network platform that connects travelers to share recommendations, find travel buddies, and plan trips. 
                The Service allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and share travel recommendations</li>
                <li>Connect with other travelers as "buddies"</li>
                <li>Plan and organize trips</li>
                <li>Earn achievements and badges</li>
                <li>Search and discover travel destinations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">3.1 Account Creation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must be at least 13 years old to use the Service</li>
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You may not share your account with others</li>
              </ul>

              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">3.2 Account Responsibility</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must immediately notify us of any unauthorized use of your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">4. User Content</h2>
              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">4.1 Your Content</h3>
              <p>You retain ownership of content you post on CityPulse. By posting content, you grant CityPulse a license to display and distribute your content through the Service.</p>

              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">4.2 Content Guidelines</h3>
              <p>You agree not to post content that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Is illegal, harmful, or violates any laws</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains false or misleading information</li>
                <li>Is spam, harassing, or abusive</li>
                <li>Contains personal information of others without consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">5. User Conduct</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service only for lawful purposes</li>
                <li>Respect other users and their privacy</li>
                <li>Not attempt to hack, disrupt, or interfere with the Service</li>
                <li>Not create fake accounts or impersonate others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">6. Disclaimers</h2>
              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">6.1 Travel Recommendations</h3>
              <p className="font-semibold text-primary">
                Travel recommendations are provided by users, not CityPulse. We do not verify the accuracy of user-generated content. 
                You use recommendations at your own risk. Always verify information independently before making travel decisions.
              </p>

              <h3 className="text-xl font-semibold text-primary mb-2 mt-4">6.2 Service Availability</h3>
              <p>The Service is provided "as is" and "as available". We do not guarantee uninterrupted or error-free service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">7. Academic Project Disclaimer</h2>
              <p>
                CityPulse is currently operating as an academic project for educational purposes. While we strive to provide a safe and functional service, 
                please be aware that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The Service may be subject to limitations and changes</li>
                <li>Full production-level support may not be available</li>
                <li>Data may be reset or modified during development phases</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, CityPulse and its operators shall not be liable for any indirect, incidental, 
                or consequential damages, loss of data, profits, or business opportunities, travel-related issues or disputes between users, 
                or content posted by other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">9. Termination</h2>
              <p>
                You may terminate your account at any time. We may suspend or terminate your account if you violate these Terms, 
                engage in fraudulent or illegal activities, or harm other users or the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mt-8 p-4 bg-pulse/10 border border-pulse/30 rounded-lg">
              <p className="font-semibold text-primary">
                By using CityPulse, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import AdvancedSearch from '../components/search/AdvancedSearch';

export default function SearchPage() {
  useAuthGuard({ requireAuth: true });

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <AdvancedSearch />
      </main>
      <BottomNavigation />
    </div>
  );
}

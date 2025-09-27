import { Link } from 'react-router-dom';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

export function RecommendationsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Recommendations</h1>
            <p className="text-gray-400 mt-2">
              Discover amazing places recommended by our community
            </p>
          </div>
          
          {user && (
            <div className="mt-4 sm:mt-0">
              <Link to="/recommendations/create">
                <Button className="bg-pulse hover:bg-pulse/80 text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Recommendation
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recommendations List */}
        <RecommendationsList />
      </div>
    </div>
  );
}

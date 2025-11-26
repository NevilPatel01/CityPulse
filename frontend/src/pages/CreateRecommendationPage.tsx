import { CreateRecommendationForm } from '../components/recommendations/CreateRecommendationForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { ArrowLeft } from 'lucide-react';

export function CreateRecommendationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSuccess = (id: number) => {
    const username = user?.username || '';
    // Use replace: true to prevent back button from returning to create form
    navigate(`/${username}/recommendation/${id}`, { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Cancel
        </button>

        {/* Create Form */}
        <CreateRecommendationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

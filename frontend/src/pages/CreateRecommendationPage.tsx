import { CreateRecommendationForm } from '../components/recommendations/CreateRecommendationForm';
import { useNavigate } from 'react-router-dom';

export function CreateRecommendationPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-base">
      <CreateRecommendationForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

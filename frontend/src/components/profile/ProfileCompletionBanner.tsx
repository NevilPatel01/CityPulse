import { Card, CardContent } from '../ui/card';

interface ProfileCompletionBannerProps {
  onCompleteProfile: () => void;
  completionPercentage: number;
}

export function ProfileCompletionBanner({ onCompleteProfile, completionPercentage }: ProfileCompletionBannerProps) {
  const getCompletionMessage = () => {
    if (completionPercentage < 30) {
      return "Complete your profile to get discovered by other members!";
    } else if (completionPercentage < 70) {
      return "You're almost there! Complete your profile to unlock all features.";
    } else {
      return "Great progress! Just a few more details to complete your profile.";
    }
  };

  const getCompletionColor = () => {
    if (completionPercentage < 30) return "text-red-400";
    if (completionPercentage < 70) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className="bg-gradient-to-r from-pulse/10 to-pulse/5 border-pulse/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h3 className="font-semibold text-primary">Complete Your Profile</h3>
            </div>
            <p className="text-sm text-muted mb-3">
              {getCompletionMessage()}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-surface-glass rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-pulse transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${getCompletionColor()}`}>
                {completionPercentage}%
              </span>
            </div>
          </div>
          <button
            onClick={onCompleteProfile}
            className="ml-4 bg-pulse text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/80 transition-colors"
          >
            Complete Now
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

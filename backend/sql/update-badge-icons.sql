-- Update Achievement Badge URLs to use uploaded images
-- Date: November 13, 2025

-- Update existing achievements with new badge images
UPDATE achievements SET badge_icon_url = '/badges/firststep.webp' WHERE name = 'First Steps';
UPDATE achievements SET badge_icon_url = '/badges/CityExplorer.webp' WHERE name = 'City Explorer';
UPDATE achievements SET badge_icon_url = '/badges/SocialButterfly.webp' WHERE name = 'Social Butterfly';
UPDATE achievements SET badge_icon_url = '/badges/ReviewMaster.webp' WHERE name = 'Review Master';
UPDATE achievements SET badge_icon_url = '/badges/GlobeTrotter.webp' WHERE name = 'Globe Trotter';
UPDATE achievements SET badge_icon_url = '/badges/RecommendationPro.webp' WHERE name = 'Recommendation Pro';

-- Insert new achievements with badge images
INSERT INTO achievements (name, description, achievement_type, target_value, badge_icon_url) VALUES
('Rising Star', 'Receive 25 likes on your recommendations', 'likes_received', 25, '/badges/RisingStar.webp'),
('Crowd Favorite', 'Receive 100 likes on your recommendations', 'likes_received', 100, '/badges/CrowdFavorite.webp'),
('Travel Network Elite', 'Connect with 50 travel buddies', 'travel_buddies_connected', 50, '/badges/TravelNetworkElite.webp'),
('Trusted Advisor', 'Receive 100 ratings on your recommendations', 'ratings_received', 100, '/badges/TrustedAdvisor.webp')
ON CONFLICT (name) DO NOTHING;

-- Add tier-based generic badges (for future use)
INSERT INTO achievements (name, description, achievement_type, target_value, badge_icon_url) VALUES
('Bronze Achiever', 'Complete your first bronze tier achievement', 'special', 1, '/badges/Bronze.webp'),
('Silver Achiever', 'Complete your first silver tier achievement', 'special', 1, '/badges/silver.webp'),
('Gold Achiever', 'Complete your first gold tier achievement', 'special', 1, '/badges/gold.webp'),
('Platinum Achiever', 'Complete your first platinum tier achievement', 'special', 1, '/badges/Platinum.webp')
ON CONFLICT (name) DO NOTHING;

-- Script to create a moderator account
-- Usage: Replace the username/email below with the desired user's credentials
-- Run this script after the user has created their normal account

-- Update user role to 'moderator' based on username or email
-- Replace 'your_username_here' with the actual username or email

-- Option 1: Update by username
UPDATE users 
-- SET role = 'moderator' 
-- WHERE username = 'nevmod';

-- Option 2: Update by email (comment out the above and use this)
-- UPDATE users 
SET role = 'moderator' 
WHERE email = 'nevilpatelmansa@gmail.com';

-- Verify the update
SELECT id, username, email, role, created_at 
FROM users 
WHERE role = 'moderator';

-- Output success message
SELECT 'Moderator account created successfully' AS status;

-- TO run this script in docker: docker exec -i citypulse-postgres-dev psql -U citypulse_user -d citypulse_dev < /backend/sql/create-moderator.sql
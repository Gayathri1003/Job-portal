-- Only insert admin user, no sample jobs or other users
INSERT INTO users (email, password_hash, role, is_paid, email_verified) 
VALUES ('admin@sarkardailyjobs.com', '$2b$10$rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kH', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Remove any existing sample data
DELETE FROM applications WHERE id > 0;
DELETE FROM jobs WHERE id > 0;
DELETE FROM employer_profiles WHERE id > 0;
DELETE FROM job_seeker_profiles WHERE id > 0;
DELETE FROM users WHERE email != 'admin@sarkardailyjobs.com';

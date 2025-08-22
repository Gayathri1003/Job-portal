-- Insert admin user
INSERT INTO users (email, password_hash, role, is_paid, email_verified) 
VALUES ('admin@sarkardailyjobs.com', '$2b$10$rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kH', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample employer
INSERT INTO users (email, password_hash, role, email_verified) 
VALUES ('employer@techcorp.com', '$2b$10$rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kH', 'employer', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample job seeker
INSERT INTO users (email, password_hash, role, is_paid, email_verified) 
VALUES ('jobseeker@example.com', '$2b$10$rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kHWKtGKVQ1fGGGvB4eK4rQZ8kH', 'job_seeker', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert employer profile
INSERT INTO employer_profiles (user_id, company_name, website, location, industry, description)
SELECT u.id, 'TechCorp Solutions', 'https://techcorp.com', 'Mumbai, India', 'Technology', 'Leading software development company'
FROM users u WHERE u.email = 'employer@techcorp.com'
ON CONFLICT DO NOTHING;

-- Insert job seeker profile
INSERT INTO job_seeker_profiles (user_id, name, location, education, job_preferences)
SELECT u.id, 'John Doe', 'Delhi, India', 'B.Tech Computer Science', '{"domains": ["Software Development", "Data Science"], "remote": true, "salary_range": "5-10 LPA"}'::jsonb
FROM users u WHERE u.email = 'jobseeker@example.com'
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (employer_id, title, description, experience_required, salary, location, country, is_remote, job_type, domain)
SELECT u.id, 'Senior Software Engineer', 'We are looking for an experienced software engineer to join our team. You will be responsible for developing scalable web applications using modern technologies.', '3-5 years', '8-15 LPA', 'Mumbai', 'India', false, 'Full-time', 'Software Development'
FROM users u WHERE u.email = 'employer@techcorp.com';

INSERT INTO jobs (employer_id, title, description, experience_required, salary, location, country, is_remote, job_type, domain)
SELECT u.id, 'Remote Data Scientist', 'Join our data science team to work on cutting-edge machine learning projects. Remote work available worldwide.', '2-4 years', '10-18 LPA', 'Remote', 'Global', true, 'Full-time', 'Data Science'
FROM users u WHERE u.email = 'employer@techcorp.com';

INSERT INTO jobs (employer_id, title, description, experience_required, salary, location, country, is_remote, job_type, domain)
SELECT u.id, 'Frontend Developer', 'Looking for a creative frontend developer to build amazing user interfaces using React and modern CSS frameworks.', '1-3 years', '5-10 LPA', 'Bangalore', 'India', false, 'Full-time', 'Frontend Development'
FROM users u WHERE u.email = 'employer@techcorp.com';

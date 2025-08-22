CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add resume_id to applications table
ALTER TABLE applications
ADD COLUMN resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL;

-- Add employer_notes and status_updated_at to applications table
ALTER TABLE applications
ADD COLUMN employer_notes TEXT,
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'success', 'error', 'info', 'warning'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    related_application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL
);

-- Update job_seeker_profiles to remove resume_url as it's now in resumes table
ALTER TABLE job_seeker_profiles
DROP COLUMN IF EXISTS resume_url;

-- Add phone_number to job_seeker_profiles
ALTER TABLE job_seeker_profiles
ADD COLUMN phone_number VARCHAR(50);

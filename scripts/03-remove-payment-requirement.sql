-- Update all existing job seekers to be marked as paid (removing payment requirement)
UPDATE users 
SET is_paid = true 
WHERE role = 'job_seeker' AND is_paid = false;

-- Optional: Clean up any payment records if you want to remove them
-- DELETE FROM payments WHERE id > 0;

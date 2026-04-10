CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'hiring_manager', 'interviewer');

CREATE TYPE job_status AS ENUM (
  'draft',
  'open',
  'paused',
  'closed',
  'archived'
);

CREATE TYPE candidate_status AS ENUM (
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected'
);
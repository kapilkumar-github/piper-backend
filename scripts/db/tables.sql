CREATE TABLE installations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_team_id TEXT UNIQUE NOT NULL,
  team_name     TEXT,
  bot_token     TEXT NOT NULL,
  bot_user_id   TEXT NOT NULL,
  installed_by  TEXT,
  installed_at  TIMESTAMPTZ DEFAULT now(),
  uninstalled_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE workspace_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_team_id TEXT NOT NULL REFERENCES installations(slack_team_id),
  slack_user_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slack_team_id, slack_user_id)
);

CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_team_id TEXT NOT NULL REFERENCES installations(slack_team_id),
  name          TEXT NOT NULL,
  description   TEXT,
  invite_code   TEXT UNIQUE NOT NULL,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'interviewer',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  is_deleted     BOOLEAN DEFAULT FALSE,
  UNIQUE(team_id, slack_user_id)
);

CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  status        job_status NOT NULL DEFAULT 'draft',
  created_by    TEXT NOT NULL REFERENCES workspace_users(slack_user_id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Basic Info
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  title           TEXT,                 -- e.g. "Backend Engineer"
  experience      INTEGER,              -- e.g. 27 months,
  current_company TEXT,

  -- Links
  resume_url      TEXT NOT NULL,
  github_url      TEXT,
  linkedin_url    TEXT,

  -- Metadata
  source          TEXT DEFAULT 'slack',

  -- Timestamps
  created_by      TEXT REFERENCES workspace_users(slack_user_id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
import { db } from "../lib/db.js";

export const createJob = async (payload) => {
  const { teamId, title, description, slackUserId } = payload;
  await db.query(
    `INSERT INTO jobs (team_id, title, description, created_by)
       VALUES ($1, $2, $3, $4)`,
    [teamId, title, description, slackUserId],
  );
};

export const getJobsByTeamId = async (teamId) => {
  const { rows } = await db.query(
    `SELECT 
    j.id,
    j.title,
    j.status,
    COUNT(c.id) AS candidate_count
    FROM jobs j
    LEFT JOIN candidates c 
    ON c.job_id = j.id  
    WHERE j.team_id = $1
    GROUP BY j.id, j.title
    ORDER BY j.created_at DESC`,
    [teamId],
  );
  return rows;
};

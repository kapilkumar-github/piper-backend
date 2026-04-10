import crypto from "crypto";
import { db } from "../lib/db.js";

export async function createTeam({
  slackTeamId,
  teamName,
  description,
  creatorSlackUserId,
  members,
}) {
  const inviteCode = generateInviteCode();

  return await db.transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO teams (slack_team_id, name, description, invite_code, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [slackTeamId, teamName, description, inviteCode, creatorSlackUserId],
    );

    const teamId = rows[0].id;

    const allMembers = [
      { userId: creatorSlackUserId, role: "admin" },
      ...members.map((userId) => ({ userId, role: "interviewer" })),
    ];

    const placeholders = allMembers
      .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
      .join(", ");

    const values = allMembers.flatMap(({ userId, role }) => [userId, role]);

    await client.query(
      `INSERT INTO team_members (team_id, slack_user_id, role)
       VALUES ${placeholders}
       ON CONFLICT (team_id, slack_user_id) DO NOTHING`,
      [teamId, ...values],
    );

    console.log(
      "Team created with ID:",
      teamId,
      "and invite code:",
      inviteCode,
    );
  });
}

export async function getTeamsByMember(slackUserId) {
  const { rows } = await db.query(
    `select t.id, t.name, t.description, tm.role from teams t
         join team_members tm on tm.team_id = t.id
         where tm.slack_user_id = $1`,
    [slackUserId],
  );
  return rows;
}

function generateInviteCode() {
  return `${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

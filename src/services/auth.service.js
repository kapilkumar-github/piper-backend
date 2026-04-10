import { db } from "../lib/db.js";

export const getSlackBotToken = async (slackTeamId) => {
  // In a real implementation, you'd look up the bot token for the given team_id from your database
  if (process.env.NODE_ENV !== "production") {
    return process.env.SLACK_BOT_TOKEN;
  }

  const { rows } = await db.query(
    `SELECT bot_token FROM installations 
   WHERE slack_team_id = $1 AND uninstalled_at IS NULL`,
    [slackTeamId],
  );

  if (!rows.length)
    throw new Error(`No installation found for team ${slackTeamId}`);
  return rows[0].bot_token;
};

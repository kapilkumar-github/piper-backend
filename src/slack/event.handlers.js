import * as AuthService from "../services/auth.service.js";
import * as DashboardView from "../views/dashboard.view.js";
// import * as ResumeService from "../services/resume.service.js";
import * as CandidateService from "../services/candidate.service.js";
import * as SlackService from "../services/slack.service.js";
import { db } from "../lib/db.js";
import * as Cache from "../lib/cache.js";

export async function handleAppHomeOpened(event, slackTeamId) {
  const { user: slackUserId } = event;

  const start = process.hrtime.bigint(); // upsert user — first time they open the app
  await db.query(
    `INSERT INTO workspace_users (slack_team_id, slack_user_id)
     VALUES ($1, $2)
     ON CONFLICT (slack_team_id, slack_user_id) DO NOTHING`,
    [slackTeamId, slackUserId],
  );
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1_000_000;

  console.log(`DB Query took ${durationMs.toFixed(2)} ms`);

  // check if user already belongs to a team
  const { rows: teams } = await db.query(
    `SELECT tm.role, t.name, t.invite_code, t.id
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.slack_user_id = $1 AND t.slack_team_id = $2`,
    [slackUserId, slackTeamId],
  );

  const botToken = await AuthService.getSlackBotToken(slackTeamId);

  if (!teams || teams.length === 0) {
    // new user — show onboarding
    await publishOnboardingHome(botToken, slackUserId);
  } else {
    // existing user — show main dashboard

    Cache.setSelectedTeam(slackUserId, teams[0].id); // default to first team
    await publishDashboardHome(botToken, slackUserId, teams);
  }
}

async function publishOnboardingHome(botToken, slackUserId) {
  await fetch("https://slack.com/api/views.publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: slackUserId,
      view: {
        type: "home",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Welcome to Piper* 👋\nGet started by creating a team or joining an existing one.",
            },
          },
          { type: "divider" },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Create a team" },
                style: "primary",
                action_id: "onboarding_create_team",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "Join existing team" },
                action_id: "onboarding_join_team",
              },
            ],
          },
        ],
      },
    }),
  });
}

async function publishDashboardHome(botToken, slackUserId, teams) {
  await fetch("https://slack.com/api/views.publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: slackUserId,
      view: await DashboardView.buildDashboardHomeView(teams, teams[0]),
    }),
  });
}

export async function upsertInstallation(data) {
  const {
    team: { id: slackTeamId, name: teamName },
    access_token: botToken,
    bot_user_id: botUserId,
    authed_user: { id: installedBy },
  } = data;

  await db.query(
    `INSERT INTO installations (slack_team_id, team_name, bot_token, bot_user_id, installed_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slack_team_id)
     DO UPDATE SET
       bot_token    = EXCLUDED.bot_token,
       bot_user_id  = EXCLUDED.bot_user_id,
       team_name    = EXCLUDED.team_name,
       installed_by = EXCLUDED.installed_by,
       installed_at = now(),
       uninstalled_at = NULL
     `,
    [slackTeamId, teamName, botToken, botUserId, installedBy],
  );

  console.log(
    `Installation upserted for workspace: ${teamName} (${slackTeamId})`,
  );
}

export async function handleAppUninstalled(team_id) {
  await db.query(
    `UPDATE installations SET uninstalled_at = now() WHERE slack_team_id = $1`,
    [team_id],
  );

  console.log(`App uninstalled from workspace with ID: ${team_id}`);
}

export async function handleMessageEvent(event) {
  // Placeholder for future message event handling logic
  console.log("Received message event:", event);
  const { user: slackUserId } = event;
  switch (event.subtype) {
    case "file_share":
      // const parsedResumes = await ResumeService.parseResume(event.files);
      const addCandidateReplyMessage =
        await CandidateService.addCandidateReplyView(event.files);
      addCandidateReplyMessage.thread_ts = event.thread_ts || event.ts; // reply in thread
      addCandidateReplyMessage.blocks.forEach((blocks) => {
        // log blocks for debugging
        SlackService.sendMessageToUser(slackUserId, {
          thread_ts: addCandidateReplyMessage.thread_ts,
          text: addCandidateReplyMessage.text,
          blocks, // send one block at a time for better formatting in Slack
        });
      });
      break;
    default:
      // Handle regular messages or other subtypes if needed
      break;
  }
}

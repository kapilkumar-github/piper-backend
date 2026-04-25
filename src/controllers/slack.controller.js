import { getSelectedTeam } from "../lib/cache.js";
import { candidateDropDownOptions } from "../services/candidate.service.js";
import * as SlackEventHandlers from "../slack/event.handlers.js";
import * as SlackInteractionHandlers from "../slack/interaction.handlers.js";

export const installation = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("OAuth error:", error);
    return res.redirect("/api/slack/error");
  }

  try {
    // exchange code for token
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("oauth.v2.access error:", data.error);
      return res.redirect("/slack/error");
    }

    // save to installations
    await SlackEventHandlers.upsertInstallation(data);

    res.redirect("/api/slack/success");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect("/api/slack/error");
  }
};

export const mockSlackInstallFlow = (req, res) => {
  // This is just a mock route to simulate the Slack install flow without actually going through OAuth.
  // In production, we would use the real OAuth flow as shown in the installation function above.
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID,
    scope:
      "chat:write,im:write,im:history,files:read,channels:history,users:read,app_mentions:read",
    redirect_uri: process.env.SLACK_REDIRECT_URI,
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
  console.log("This is a mock install route.");
};

export const interactions = (req, res) => {
  const payload = JSON.parse(req.body.payload);

  // acknowledge immediately

  switch (payload.type) {
    case "block_actions":
      res.sendStatus(200);
      handleBlockActions(payload);
      break;
    case "view_submission":
      // ✅ respond properly to Slack
      res.json({ response_action: "clear" });
      handleViewSubmission(payload);
      break;
    default:
      console.log("Unhandled interaction type:", payload.type);
  }
};

export const events = (req, res) => {
  const { type, challenge, event, team_id } = req.body;

  if (type === "url_verification") {
    return res.json({ challenge });
  }

  // acknowledge immediately — Slack needs 200 within 3 seconds
  res.json({
    response_action: "clear",
  });

  switch (event?.type) {
    case "app_home_opened":
      SlackEventHandlers.handleAppHomeOpened(event, team_id);
      break;
    case "app_uninstalled":
      SlackEventHandlers.handleAppUninstalled(team_id);
      break;
    case "message":
      SlackEventHandlers.handleMessageEvent(event);
      break;
    default:
      console.log("Unhandled event type:", event?.type);
  }
};

export const options = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const query = payload.value || "";
  const teamId = getSelectedTeam(payload.user.id);

  switch (payload.action_id) {
    case "select_candidate":
      const options = await candidateDropDownOptions(
        query,
        teamId,
        payload.user.id,
      );
      res.json({ options });
      break;
    default:
      res.status(400).json({ options: [] });
  }
};

// Interaction Block
function handleBlockActions(payload) {
  const action = payload.actions[0];

  switch (action.action_id) {
    case "switch_team":
      return SlackInteractionHandlers.handleTeamSwitch(payload);
    case "onboarding_create_team":
      return SlackInteractionHandlers.openCreateTeamModal(payload.trigger_id);
    case "onboarding_join_team":
      return SlackInteractionHandlers.openJoinTeamModal(payload.trigger_id);
    case "create_job":
      return SlackInteractionHandlers.openCreateJobModal(
        payload.trigger_id,
        action.value,
      );
    case "open_add_candidate_modal":
      return SlackInteractionHandlers.openAddCandidateModal(
        payload.trigger_id,
        payload.user.id,
        action.value,
        payload.message.ts || payload.message.thread_ts, // pass message ts for later updates
        payload.channel.id, // pass channel ID for later updates
      );
    case "open_schedule_interview_modal":
      return SlackInteractionHandlers.openScheduleInterviewModal(
        payload.trigger_id,
        payload.user.id,
        action.value,
        payload.message.ts || payload.message.thread_ts, // pass message ts for later updates
        payload.channel.id, // pass channel ID for later updates
      );
    default:
      console.log("Unhandled block action:", action.action_id);
  }
}

function handleViewSubmission(payload) {
  switch (payload.view.callback_id) {
    case "create_team_modal":
      return SlackInteractionHandlers.handleCreateTeamSubmission(payload);
    case "create_job_modal":
      return SlackInteractionHandlers.handleCreateJobSubmission(payload);
    case "add_candidate_modal":
      const formData = payload.view.state.values;
      const privateMetadata = JSON.parse(payload.view.private_metadata);
      return SlackInteractionHandlers.handleAddCandidate(
        payload,
        formData,
        privateMetadata,
      );
    default:
      console.log("Unhandled view submission:", payload.view.callback_id);
  }
}

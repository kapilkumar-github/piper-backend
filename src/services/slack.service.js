import * as DashboardView from "../views/dashboard.view.js";
import * as AuthService from "./auth.service.js";

export async function notifyAndRefreshMembers(userIds, teamName, inviteCode) {
  const botToken = await AuthService.getSlackBotToken();

  const notifications = userIds.map((userId) =>
    Promise.all([
      sendDM(botToken, userId, teamName),
      publishHomeTab(botToken, userId),
    ]),
  );

  await Promise.all(notifications);
}

async function sendDM(botToken, userId, teamName) {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: userId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `You've been added to *${teamName}* on Piper.`,
          },
        },
      ],
    }),
  });
}

async function publishHomeTab(botToken, userId) {
  await fetch("https://slack.com/api/views.publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      view: {
        type: "home",
        blocks: [
          {
            type: "section",
            view: await DashboardView.buildDashboardHomeView(),
          },
        ],
      },
    }),
  });
}

export async function sendMessageToUser(userId, message) {
  const botToken = await AuthService.getSlackBotToken();

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: userId,
      text: message.text,
      blocks: message.blocks,
    }),
  });
}

export async function updateChatMessage(channelId, ts, text, blocks) {
  const botToken = await AuthService.getSlackBotToken();

  await fetch("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: channelId,
      ts,
      text,
      blocks,
    }),
  });
}

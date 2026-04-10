import { dummyHomeData } from "../test/mock.data.js";
import * as JobService from "../services/job.service.js";

export async function buildDashboardHomeView(teams, selectedTeam) {
  const { teamId, teamName, role, candidates, todayInterviews } =
    dummyHomeData || teams[0] || {};

  const jobs = (await JobService.getJobsByTeamId(selectedTeam.id)) || [];
  const jobSlice = jobs.length > 3 ? jobs.slice(0, 3) : jobs;
  const jsonView = {
    type: "home",
    blocks: [
      // ── Team ──
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${teamName}* · ${role}`,
        },
        accessory: {
          type: "static_select",
          action_id: "switch_team",
          initial_option: {
            text: {
              type: "plain_text",
              text: selectedTeam.name || "Select a team",
            },
            value: selectedTeam.id || "no_team",
          },
          options: [
            ...teams?.map((t) => ({
              text: { type: "plain_text", text: t.name },
              value: t.id,
            })),
            {
              text: { type: "plain_text", text: "➕ Create new team" },
              value: "onboarding_create_team",
            },
          ],
        },
      },
      { type: "divider" },

      // ── Candidates ──
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Candidates*" },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "+ Add candidate" },
          style: "primary",
          action_id: "add_candidate",
        },
      },
      ...candidates.slice(0, 3).map((c) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${c.name}* · ${c.role}\n${c.stage} · Added ${c.addedAt}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View" },
          action_id: `view_candidate_${c.id}`,
        },
      })),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View all candidates" },
            action_id: "open_candidates",
          },
        ],
      },
      { type: "divider" },

      // ── Jobs ──
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Jobs*" },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "+ Create job" },
          action_id: "create_job",
          value: selectedTeam.id || teamId, // pass teamId to the action for context
        },
      },
      ...jobSlice.map((j) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${j.title}* · ${j.status}\n${j.candidate_count} candidates · ${j.interviewing_count} interviewing`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View" },
          action_id: `view_job_${j.id}`,
        },
      })),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View all jobs" },
            action_id: "open_jobs",
          },
        ],
      },
      { type: "divider" },

      // ── Interviews ──
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Interviews*" },
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "*Today*" }],
      },
      ...(todayInterviews.length
        ? todayInterviews.map((i) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${i.candidateName}* · ${i.role} · Round ${i.round}\n🕐 ${i.time} · ${i.interviewer}`,
            },
            accessory: {
              type: "button",
              text: { type: "plain_text", text: "View" },
              action_id: `view_interview_${i.id}`,
            },
          }))
        : [
            {
              type: "section",
              text: { type: "mrkdwn", text: "_No interviews today_" },
            },
          ]),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View all interviews" },
            action_id: "open_interviews",
          },
        ],
      },
      { type: "divider" },

      // ── Manage ──
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Manage*" },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "✨ Create Team" },
            action_id: "onboarding_create_team",
            style: "primary",
          },
          {
            type: "button",
            text: { type: "plain_text", text: "⚙️ Settings" },
            action_id: "settings",
          },
        ],
      },
    ],
  };

  //   teams.forEach((element, index) => {

  //   });

  return jsonView;
}

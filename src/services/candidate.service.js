import { db } from "../lib/db.js";
import * as TeamService from "./team.service.js";
import * as Cache from "../lib/cache.js";
import * as JobService from "./job.service.js";

export async function buildCandidatesMessage(candidates = [], slackUserId) {
  // Get all teams and jobs for the dropdowns
  const teams = await TeamService.getTeamsByMember(slackUserId);
  const selectedTeamId = Cache.getSelectedTeam(slackUserId);
  const selectedTeam =
    teams.find((t) => t.id === selectedTeamId) || teams[0] || {};
  const jobs = (await JobService.getJobsByTeamId(selectedTeam.id)) || [];
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "\n\n*📄 AI-Parsed Candidate Details*",
      },
    },
    {
      type: "divider",
    },
  ];

  candidates.forEach((candidate, index) => {
    blocks.push(
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Name:* ${candidate.name || "N/A"}\n`,
          },
          {
            type: "mrkdwn",
            text: `*Email:* ${candidate.email || "N/A"}\n`,
          },
          {
            type: "mrkdwn",
            text: `*Phone:* ${candidate.phone || "N/A"}\n`,
          },
          {
            type: "mrkdwn",
            text: `*Company:* ${candidate.currentCompany || "N/A"}\n`,
          },
          {
            type: "mrkdwn",
            text: `*Title:* ${candidate.currentTitle || "N/A"}\n`,
          },
          {
            type: "mrkdwn",
            text: `*Experience:* ${candidate.experienceInMonths ? `${Math.floor(candidate.experienceInMonths / 12)} years and ${candidate.experienceInMonths % 12} months` : "N/A"}\n`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📎 Resume:* <${candidate.resumeUrl}|Download Resume>`,
        },
      },
      {
        type: "actions",
        block_id: `candidate_details_${index}`,
        elements: [
          {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select Team",
            },
            action_id: "select_team",
            initial_option: {
              text: {
                type: "plain_text",
                text: selectedTeam.name || "Select a team",
              },
              value: selectedTeam.id || "no_team",
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: selectedTeam.name,
                },
                value: selectedTeam.id,
              },
            ],
          },
          {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select Job",
            },
            action_id: "select_job",
            options: jobs.map((job) => ({
              text: {
                type: "plain_text",
                text: job.title,
              },
              value: job.id,
            })),
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "+ Add Candidate",
            },
            style: "primary",
            action_id: "add_candidate",
            value: JSON.stringify({
              candidate,
              index,
            }),
          },
        ],
      },
      {
        type: "divider",
      },
    );
  });

  return {
    text: "Parsed candidates",
    blocks,
  };
}

export async function addCandidate(candidateData, selectedValues, userId) {
  const selectedTeamId = selectedValues.select_team.selected_option.value;
  const selectedJobId = selectedValues.select_job.selected_option.value;

  const query = `
    INSERT INTO candidates 
    (name, email, phone, current_company, title, resume_url, job_id, created_by, team_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    candidateData.name,
    candidateData.email,
    candidateData.phone,
    candidateData.currentCompany,
    candidateData.currentTitle,
    candidateData.resumeUrl,
    selectedJobId && selectedJobId !== "null" ? selectedJobId : null, // 👈 key line
    userId,
    selectedTeamId,
  ];

  const result = await db.query(query, values);
  return result.rows;
}

export async function addCandidateBulk(candidateData, jobId, userId, teamId) {
  const query = `insert into candidates (name, email, phone, current_company, current_title, resume_url, job_id, created_by, team_id) values ${candidateData
    .map(
      (c) =>
        `('${c.name}', '${c.email}', '${c.phone}', '${c.currentCompany}', '${c.currentTitle}', '${c.resumeUrl}', '${jobId}', '${userId}', '${teamId}')`,
    )
    .join(", ")} returning *`;

  const result = await db.query(query);
  console.log(
    `Added ${result.rowCount} candidates: ${result.rows
      .map((r) => r.name)
      .join(", ")}`,
  );
  return result.rows;
}

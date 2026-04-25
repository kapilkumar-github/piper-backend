import { db } from "../lib/db.js";
import * as TeamService from "./team.service.js";
import * as Cache from "../lib/cache.js";
import * as JobService from "./job.service.js";

export async function addCandidateReplyView(resumes) {
  const blocks = [];

  resumes.forEach((file, index) => {
    blocks.push([
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📄 File:* ${file.name || "Unnamed file"}`,
        },
      },
      {
        type: "actions",
        block_id: `add_candidate_${index}`,
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "+ Add Candidate",
            },
            style: "primary",
            action_id: "open_add_candidate_modal",
            value: JSON.stringify({
              file,
              index,
            }),
          },
        ],
      },
      {
        type: "divider",
      },
    ]);
  });

  return {
    text: "Add candidates from uploaded files",
    blocks,
  };
}

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
        text: "\n\n*📄 Please fill candidate details*",
      },
    },
    {
      type: "divider",
    },
  ];

  candidates.forEach((candidate, index) => {
    blocks.push(
      // Name
      {
        type: "input",
        block_id: `name_${index}`,
        label: {
          type: "plain_text",
          text: "Name",
        },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
        },
      },

      // Email
      {
        type: "input",
        block_id: `email_${index}`,
        label: {
          type: "plain_text",
          text: "Email",
        },
        element: {
          type: "plain_text_input",
          action_id: "email_input",
        },
      },

      // Phone
      {
        type: "input",
        block_id: `phone_${index}`,
        label: {
          type: "plain_text",
          text: "Phone",
        },
        element: {
          type: "plain_text_input",
          action_id: "phone_input",
        },
      },

      // Company
      {
        type: "input",
        block_id: `company_${index}`,
        label: {
          type: "plain_text",
          text: "Current Company",
        },
        element: {
          type: "plain_text_input",
          action_id: "company_input",
        },
      },

      // Title
      {
        type: "input",
        block_id: `title_${index}`,
        label: {
          type: "plain_text",
          text: "Current Title",
        },
        element: {
          type: "plain_text_input",
          action_id: "title_input",
        },
      },

      // Experience
      {
        type: "input",
        block_id: `experience_${index}`,
        label: {
          type: "plain_text",
          text: "Experience (in years)",
        },
        element: {
          type: "plain_text_input",
          action_id: "experience_input",
        },
      },

      // Resume link (still display)
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📎 Resume:* <${candidate.resumeUrl}|Download Resume>`,
        },
      },

      // Actions
      {
        type: "actions",
        block_id: `candidate_actions_${index}`,
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
            value: JSON.stringify({ index }),
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

export async function addCandidate(candidateData, userId) {
  const query = `
    INSERT INTO candidates 
    (name, email, phone, current_company, resume_url, job_id, created_by, team_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [
    candidateData.name,
    candidateData.email,
    candidateData.phone,
    candidateData.currentCompany,
    candidateData.resumeUrl,
    candidateData.jobId ? candidateData.jobId : null, // 👈 key line
    userId,
    candidateData.teamId,
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

export async function candidateDropDownOptions(query, teamId, userId) {
  const dbQuery = `
    SELECT id, name, phone, email
FROM candidates
WHERE team_id = $1
  AND name ILIKE $2
ORDER BY 
  CASE WHEN created_by = $3 THEN 0 ELSE 1 END,
  created_at DESC
LIMIT 20;
  `;

  const values = [teamId, `%${query}%`, userId];
  console.log("Executing candidate dropdown query with values:", values);

  const result = await db.query(dbQuery, values);
  return result.rows.map((row) => {
    const date = new Date(row.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    return {
      text: {
        type: "plain_text",
        text: `${row.name} | ${row.phone || "NA"} | ${row.email || "NA"}`,
      },
      value: String(row.id),
    };
  });
}

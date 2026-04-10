import * as SlackService from "../services/slack.service.js";
import * as AuthService from "../services/auth.service.js";
import * as TeamService from "../services/team.service.js";
import * as JobService from "../services/job.service.js";
import * as CandidateService from "../services/candidate.service.js";
import * as Cache from "../lib/cache.js";

export async function handleTeamSwitch(action, slackUserId) {
  const selectedTeamId = action.selected_option.value;
  Cache.setSelectedTeam(slackUserId, selectedTeamId);
}

export async function openCreateTeamModal(triggerId) {
  await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await AuthService.getSlackBotToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trigger_id: triggerId,
      view: {
        type: "modal",
        callback_id: "create_team_modal",
        title: { type: "plain_text", text: "Create a team" },
        submit: { type: "plain_text", text: "Create" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "team_name",
            label: { type: "plain_text", text: "Team name" },
            element: {
              type: "plain_text_input",
              action_id: "team_name_input",
              placeholder: {
                type: "plain_text",
                text: "e.g. Engineering hiring",
              },
            },
          },
          {
            type: "input",
            block_id: "team_description",
            label: { type: "plain_text", text: "Description" },
            optional: true,
            element: {
              type: "plain_text_input",
              action_id: "team_description_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "What is this team hiring for?",
              },
            },
          },
          {
            type: "input",
            block_id: "team_members",
            label: { type: "plain_text", text: "Invite members" },
            optional: true,
            element: {
              type: "multi_users_select",
              action_id: "team_members_input",
              placeholder: { type: "plain_text", text: "Select team members" },
            },
          },
        ],
      },
    }),
  });
}

export async function openJoinTeamModal(triggerId) {}

export async function handleCreateTeamSubmission(payload) {
  // 1. extract values
  const values = payload.view.state.values;
  const teamName = values.team_name.team_name_input.value;
  const description = values.team_description.team_description_input.value;
  const members = values.team_members.team_members_input.selected_users ?? [];

  const creatorSlackUserId = payload.user.id;
  const slackTeamId = payload.team.id;

  // 3. save to DB
  await TeamService.createTeam({
    slackTeamId,
    teamName,
    description,
    creatorSlackUserId,
    members,
  });

  // 4. notify members and refresh their home tab
  const allUsers = [creatorSlackUserId, ...members];
  await SlackService.notifyAndRefreshMembers(allUsers, teamName);
}

export const openCreateJobModal = async (triggerId, teamId) => {
  await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await AuthService.getSlackBotToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trigger_id: triggerId,
      view: {
        type: "modal",
        callback_id: "create_job_modal",
        title: { type: "plain_text", text: "Create a job" },
        submit: { type: "plain_text", text: "Create" },
        close: { type: "plain_text", text: "Cancel" },
        private_metadata: JSON.stringify({
          teamId,
        }),
        blocks: [
          {
            type: "input",
            block_id: "job_title",
            label: { type: "plain_text", text: "Job title" },
            element: {
              type: "plain_text_input",
              action_id: "job_title_input",
              placeholder: {
                type: "plain_text",
                text: "e.g. Senior Backend Engineer",
              },
            },
          },
          {
            type: "input",
            block_id: "job_description",
            label: { type: "plain_text", text: "Description" },
            optional: true,
            element: {
              type: "plain_text_input",
              action_id: "job_description_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Describe the role and responsibilities...",
              },
            },
          },
        ],
      },
    }),
  });
};

export const handleCreateJobSubmission = async (payload) => {
  // 1. extract values
  const values = payload.view.state.values;
  const jobTitle = values.job_title.job_title_input.value;
  const description = values.job_description.job_description_input.value;
  const { teamId } = JSON.parse(payload.view.private_metadata); // we can set this when opening the modal if needed

  console.log("Received create job submission:", teamId, jobTitle, description);

  const slackUserId = payload.user.id;

  // Insert into jobs table
  await JobService.createJob({
    teamId,
    title: jobTitle,
    description,
    slackUserId,
  });

  // For now, just log the values. In a real implementation, you'd save this to the database and update the UI.
  console.log("Job created successfully");
};

export const handleAddCandidate = async (
  payload,
  selectedValues,
  candidate,
  index,
) => {
  // Here you would typically open a modal to input candidate details, similar to the create job modal.
  CandidateService.addCandidate(
    candidate, // pass the individual candidate data
    selectedValues,
    payload.user.id,
  );

  const updatedBlocks = payload.message.blocks
    .map((block) => {
      // Replace the specific candidate block
      if (block.block_id === `candidate_details_${index}`) {
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Team: ${selectedValues.select_team.selected_option.text}\nJob: ${selectedValues.select_job.selected_option.text}\n\n✅ *Candidate Added*`,
          },
        };
      }

      // Remove actions block for this candidate
      if (
        block.type === "actions" &&
        block.block_id === `candidate_details_${index}`
      ) {
        return null;
      }

      return block;
    })
    .filter(Boolean);
  // Update the UI
  await SlackService.updateChatMessage(
    payload.channel.id,
    payload.message.ts,
    "Candidate added",
    updatedBlocks,
  );
};

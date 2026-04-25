import * as SlackService from "../services/slack.service.js";
import * as AuthService from "../services/auth.service.js";
import * as TeamService from "../services/team.service.js";
import * as JobService from "../services/job.service.js";
import * as CandidateService from "../services/candidate.service.js";
import * as Cache from "../lib/cache.js";
import { CandidateAddedMessage } from "../messages/candidate.msg.js";
import { Modal } from "antd";
import { ScheduleInterviewForm } from "../views/modal.view.js";

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
export async function openAddCandidateModal(
  triggerId,
  slackUserId,
  action,
  addCandidateMessageId,
  channelId,
  candidate = {},
) {
  // ✅ Safe parsing
  const parsed = typeof action === "string" ? JSON.parse(action) : action;
  const { file, index } = parsed;

  // ✅ Better metadata for later use
  const privateMetadata = {
    channelId,
    addCandidateMessageId,
    fileUrl: file.url_private,
    fileName: file.name,
    fileId: file.id,
    index,
  };

  const selectedTeamId = Cache.getSelectedTeam(slackUserId);
  const jobs = await JobService.getJobsByTeamId(selectedTeamId);

  await SlackService.openModal(triggerId, {
    type: "modal",
    callback_id: "add_candidate_modal",
    title: { type: "plain_text", text: "Add Candidate" },
    submit: { type: "plain_text", text: "Add" },
    close: { type: "plain_text", text: "Cancel" },
    private_metadata: JSON.stringify(privateMetadata),

    blocks: [
      // 📎 Resume link (opens in Slack viewer)
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Resume:* <${file.permalink}|${file.name}>`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Team:* ${selectedTeamId ? selectedTeamId : "N/A"}`,
        },
      },

      // 👤 Name
      {
        type: "input",
        block_id: "name_block",
        label: {
          type: "plain_text",
          text: "Name",
        },
        element: {
          type: "plain_text_input",
          action_id: "name",
          initial_value: candidate?.name || "",
          placeholder: {
            type: "plain_text",
            text: "Enter full name",
          },
        },
      },

      // 📧 Email
      {
        type: "input",
        block_id: "email_block",
        label: {
          type: "plain_text",
          text: "Email",
        },
        element: {
          type: "plain_text_input",
          action_id: "email",
          initial_value: candidate?.email || "",
          placeholder: {
            type: "plain_text",
            text: "example@email.com",
          },
        },
      },

      // 📱 Phone
      {
        type: "input",
        block_id: "phone_block",
        label: {
          type: "plain_text",
          text: "Phone Number",
        },
        element: {
          type: "plain_text_input",
          action_id: "phone",
          initial_value: candidate?.phone || "",
          placeholder: {
            type: "plain_text",
            text: "+91 9876543210",
          },
        },
      },

      // 📊 Experience (dropdown instead of free text)
      {
        type: "input",
        block_id: "experience_block",
        label: {
          type: "plain_text",
          text: "Experience",
        },
        element: {
          type: "static_select",
          action_id: "experience",
          placeholder: {
            type: "plain_text",
            text: "Select experience",
          },
          options: [
            "0-1 years",
            "1-3 years",
            "3-5 years",
            "5-8 years",
            "8+ years",
          ].map((exp) => ({
            text: { type: "plain_text", text: exp },
            value: exp,
          })),
        },
      },

      // 💼 Job selection (safe + optional)
      {
        type: "input",
        block_id: "job_block",
        optional: true,
        label: {
          type: "plain_text",
          text: "Select Job",
        },
        element: {
          type: "static_select",
          action_id: "select_job_add_candidate_modal",
          placeholder: {
            type: "plain_text",
            text: "Select a job",
          },
          options: jobs.length
            ? jobs.map((job) => ({
                text: {
                  type: "plain_text",
                  text: job.title,
                },
                value: job.id,
              }))
            : [
                {
                  text: {
                    type: "plain_text",
                    text: "No jobs available",
                  },
                  value: "no_jobs",
                },
              ],
        },
      },
    ],
  });
}

export const handleAddCandidate = async (
  payload,
  formData,
  privateMetadata,
  index,
) => {
  const { addCandidateMessageId, channelId, fileUrl } = privateMetadata;
  // Here you would typically open a modal to input candidate details, similar to the create job modal.
  const candidate = {
    name: formData.name_block.name.value,
    email: formData.email_block.email.value,
    phone: formData.phone_block.phone.value,
    experience: formData.experience_block.experience.selected_option.value,
    resumeUrl: fileUrl,
    jobId: formData.job_block?.select_job_add_candidate_modal?.selected_option
      ? formData.job_block.select_job_add_candidate_modal.selected_option.value
      : null,
    teamId: Cache.getSelectedTeam(payload.user.id),
  };
  const result = await CandidateService.addCandidate(
    candidate, // pass the individual candidate data
    payload.user.id,
  );

  const postCandidateAddedMessage = CandidateAddedMessage(result[0]);

  console.log("Candidate added successfully:", result[0]);
  console.log(
    "Post-add candidate message:",
    channelId,
    addCandidateMessageId,
    postCandidateAddedMessage,
  );

  // Update the original message with candidate details and actions
  const response = await SlackService.updateChatMessage(
    channelId,
    addCandidateMessageId,
    postCandidateAddedMessage.text,
    postCandidateAddedMessage.blocks,
  );

  console.log("Slack API response for updating candidate message:", response);
  if (!response.ok) {
    console.error("Failed to update candidate message:", response.error);
  }
};

export async function openScheduleInterviewModal(
  triggerId,
  slackUserId,
  action,
  addCandidateMessageId,
  channelId,
  candidate = {},
) {
  // Similar structure to openAddCandidateModal, but with date/time pickers and interview details
  await SlackService.openModal(
    triggerId,
    ScheduleInterviewForm(channelId, addCandidateMessageId),
  );
}

export const UpdateCandidateForm = (isEditing) => {
  const view = {
    type: "modal",
    callback_id: "update_candidate_form",
    title: {
      type: "plain_text",
      text: "Add Candidate",
    },
    submit: {
      type: "plain_text",
      text: "Submit",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    private_metadata: JSON.stringify({
      fileId: file.id, // optional
    }),
    blocks: [
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
        },
      },
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
        },
      },
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
        },
      },
      {
        type: "input",
        block_id: "experience_block",
        label: {
          type: "plain_text",
          text: "Experience (years)",
        },
        element: {
          type: "plain_text_input",
          action_id: "experience",
          initial_value: candidate?.experience || "",
        },
      },
    ],
  };
};

export const ScheduleInterviewForm = (channelId, threadTs) => {
  const view = {
    type: "modal",
    callback_id: "schedule_interview_modal",
    title: { type: "plain_text", text: "Schedule Interview" },
    submit: { type: "plain_text", text: "Schedule" },
    close: { type: "plain_text", text: "Cancel" },

    private_metadata: JSON.stringify({
      channelId,
      threadTs,
    }),

    blocks: [
      // 🔍 Candidate search
      {
        type: "input",
        block_id: "candidate_block",
        label: {
          type: "plain_text",
          text: "Select Candidate",
        },
        element: {
          type: "external_select",
          action_id: "select_candidate",
          placeholder: {
            type: "plain_text",
            text: "Search candidate...",
          },
          min_query_length: 1,
        },
      },

      // 👨‍💼 Interviewer search
      {
        type: "input",
        block_id: "interviewer_block",
        label: {
          type: "plain_text",
          text: "Select Interviewer",
        },
        element: {
          type: "external_select",
          action_id: "select_interviewer",
          placeholder: {
            type: "plain_text",
            text: "Search interviewer...",
          },
          min_query_length: 2,
        },
      },

      // 🔢 Round
      {
        type: "input",
        block_id: "round_block",
        label: {
          type: "plain_text",
          text: "Round",
        },
        element: {
          type: "static_select",
          action_id: "round",
          options: [1, 2, 3, 4, 5].map((r) => ({
            text: {
              type: "plain_text",
              text: `Round ${r}`,
            },
            value: String(r),
          })),
        },
      },

      // 📅 Date
      {
        type: "input",
        block_id: "date_block",
        label: {
          type: "plain_text",
          text: "Select Date",
        },
        element: {
          type: "datepicker",
          action_id: "date",
        },
      },

      // ⏰ Time
      {
        type: "actions",
        block_id: "time_selectors",
        elements: [
          {
            type: "static_select",
            action_id: "hour",
            placeholder: {
              type: "plain_text",
              text: "Hour",
            },
            options: Array.from({ length: 24 }, (_, i) => ({
              text: {
                type: "plain_text",
                text: String(i).padStart(2, "0"),
              },
              value: String(i),
            })),
          },
          {
            type: "static_select",
            action_id: "minute",
            placeholder: {
              type: "plain_text",
              text: "Minute",
            },
            options: ["00", "15", "30", "45"].map((m) => ({
              text: {
                type: "plain_text",
                text: m,
              },
              value: m,
            })),
          },
        ],
      },
    ],
  };

  return view;
};

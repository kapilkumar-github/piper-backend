export const CandidateAddedMessage = (candidate) => {
  const message = {
    text: "Candidate added successfully",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *Candidate Added Successfully!*\n\n*Name:* ${candidate.name}\n*Email:* ${candidate.email}\n*Phone:* ${candidate.phone}\n*Experience:* ${candidate.experience}`,
        },
      },

      {
        type: "actions",
        block_id: "candidate_post_actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "✏️ Edit Candidate",
            },
            action_id: "edit_candidate",
            value: JSON.stringify({
              candidateId: candidate.id,
            }),
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "📅 Schedule Interview",
            },
            style: "primary",
            action_id: "open_schedule_interview_modal",
            value: JSON.stringify({
              candidateId: candidate.id,
            }),
          },
        ],
      },
    ],
  };
  return message;
};

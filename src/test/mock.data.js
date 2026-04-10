export const dummyHomeData = {
  teamId: "team_123",
  teamName: "Engineering Hiring",
  role: "Admin",
  candidates: [
    {
      id: "1",
      name: "Arjun Mehta",
      role: "Backend Engineer",
      stage: "Interviewing",
      addedAt: "3 days ago",
    },
    {
      id: "2",
      name: "Priya Sharma",
      role: "Frontend Engineer",
      stage: "Shortlisted",
      addedAt: "5 days ago",
    },
    {
      id: "3",
      name: "Sneha Rao",
      role: "Full Stack",
      stage: "Feedback pending",
      addedAt: "1 week ago",
    },
  ],
  jobs: [
    {
      id: "1",
      title: "Backend Engineer",
      status: "Active",
      candidateCount: 8,
      interviewingCount: 3,
    },
    {
      id: "2",
      title: "Frontend Engineer",
      status: "Active",
      candidateCount: 5,
      interviewingCount: 1,
    },
    {
      id: "3",
      title: "DevOps Engineer",
      status: "Paused",
      candidateCount: 3,
      interviewingCount: 0,
    },
  ],
  todayInterviews: [
    {
      id: "1",
      candidateName: "Arjun Mehta",
      role: "Backend Engineer",
      round: 2,
      time: "10:00 AM",
      interviewer: "Rahul K.",
    },
    {
      id: "2",
      candidateName: "Priya Sharma",
      role: "Frontend Engineer",
      round: 1,
      time: "2:30 PM",
      interviewer: "You",
    },
  ],
};

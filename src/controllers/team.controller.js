// In-memory store (replace with DB later)
const teams = [];
const memberships = [];

export const createTeam = (req, res) => {
  const { teamName, userId } = req.body;

  const team = {
    id: Date.now().toString(),
    name: teamName,
    createdBy: userId,
  };

  teams.push(team);

  memberships.push({
    userId,
    teamId: team.id,
    roles: ["ADMIN"],
    status: "ACTIVE",
  });

  return res.json({
    message: "Team created",
    team,
  });
};

export const joinTeam = (req, res) => {
  const { teamId, userId } = req.body;

  memberships.push({
    userId,
    teamId,
    roles: ["UNASSIGNED"],
    status: "PENDING",
  });

  return res.json({
    message: "Join request sent",
  });
};

export const assignRole = (req, res) => {
  const { teamId, userId, roles } = req.body;

  const member = memberships.find(
    (m) => m.teamId === teamId && m.userId === userId,
  );

  if (!member) {
    return res.status(404).json({ message: "User not found in team" });
  }

  member.roles = roles;
  member.status = "ACTIVE";

  return res.json({
    message: "Role assigned",
    member,
  });
};

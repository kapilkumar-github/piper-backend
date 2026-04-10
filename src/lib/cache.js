const SELECTED_TEAM_OBJECT = {};

export function setSelectedTeam(userId, teamId) {
  SELECTED_TEAM_OBJECT[userId] = teamId;
}

export function getSelectedTeam(userId) {
  return SELECTED_TEAM_OBJECT[userId];
}

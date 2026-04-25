const SELECTED_TEAM_OBJECT = {};

export function setSelectedTeam(userId, teamId) {
  SELECTED_TEAM_OBJECT[userId] = teamId;
}

export function getSelectedTeam(userId) {
  let selectedTeam = SELECTED_TEAM_OBJECT[userId];
  if (!selectedTeam) {
    selectedTeam = null;
  }
  return selectedTeam;
}

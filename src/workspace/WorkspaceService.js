export class WorkspaceService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  createWorkspace(name, sheetId, clientId, clientSecret) {
    return this.storageService.saveWorkspace(name, {
      SHEET_ID: sheetId,
      CLIENT_ID: clientId,
      CLIENT_ID_SECRET: clientSecret,
    });
  }

  addProfile(workspaceName, profileData) {
    return this.storageService.addProfileToWorkspace(
      workspaceName,
      profileData,
    );
  }

  getWorkspace(name) {
    return this.storageService.getWorkspace(name);
  }

  getWorkspaceNames() {
    return this.storageService.getWorkspaceNames();
  }

  getProfiles(workspaceName) {
    return this.storageService.getProfiles(workspaceName);
  }
}

import fs from "fs";
import os from "os";
import path from "path";

export class WorkspaceStorageService {
  constructor() {
    this.configDir = path.join(os.homedir(), ".config", "sheenv");
    this.workspacesDir = path.join(this.configDir, "workspaces");
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.workspacesDir)) {
      fs.mkdirSync(this.workspacesDir, { recursive: true });
    }
  }

  saveWorkspace(name, data) {
    const filePath = path.join(this.workspacesDir, `${name}.json`);
    const workspaceData = {
      ...data,
      profiles: [],
    };
    fs.writeFileSync(filePath, JSON.stringify(workspaceData, null, 2));
    return { name, ...workspaceData };
  }

  addProfileToWorkspace(workspaceName, profileData) {
    const filePath = path.join(this.workspacesDir, `${workspaceName}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Workspace ${workspaceName} not found`);
    }

    const workspace = JSON.parse(fs.readFileSync(filePath, "utf8"));
    workspace.profiles.push(profileData);

    fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
    return profileData;
  }

  getWorkspace(name) {
    const filePath = path.join(this.workspacesDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Workspace ${name} not found`);
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  getWorkspaceNames() {
    if (!fs.existsSync(this.workspacesDir)) {
      return [];
    }
    return fs
      .readdirSync(this.workspacesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  }

  getProfiles(workspaceName) {
    const workspace = this.getWorkspace(workspaceName);
    return workspace.profiles || [];
  }

  updateWorkspaceAuthToken(workspaceName, authToken) {
    const filePath = path.join(this.workspacesDir, `${workspaceName}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Workspace ${workspaceName} not found`);
    }

    const workspace = JSON.parse(fs.readFileSync(filePath, "utf8"));
    workspace.authToken = authToken;

    fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
    return workspace;
  }
}

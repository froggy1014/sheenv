import fs from "fs";
import os from "os";
import path from "path";

export class ProfileStorageService {
  constructor() {
    this.configDir = path.join(os.homedir(), ".config", "sheenv");
    this.ensureConfigDirectory();
  }

  ensureConfigDirectory() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  saveProfile(name, range, sheetId, clientId, clientIdSecret) {
    const envFilePath = path.join(this.configDir, `${name}`);
    const envContent = `RANGE=${range}
SHEET_ID=${sheetId}
CLIENT_ID=${clientId}
CLIENT_ID_SECRET=${clientIdSecret}
`;
    fs.writeFileSync(envFilePath, envContent, "utf8");
    return { name, range };
  }

  getProfile(profileName) {
    const filePath = path.join(this.configDir, profileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      const profile = {};
      content.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          profile[key] = value;
        }
      });
      return profile;
    }
    return null;
  }
  getProfileNames() {
    return fs
      .readdirSync(this.configDir)
      .filter((file) => file.startsWith(".env."));
  }
}

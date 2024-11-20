import fs from "fs";
import os from "os";
import path from "path";

export class ProfileStorageService {
  constructor() {
    this.configDir = path.join(os.homedir(), ".config", "env-sheet-cli");
    this.ensureConfigDirectory();
  }

  ensureConfigDirectory() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  saveProfile(name, range) {
    const envFilePath = path.join(this.configDir, `${name}`);
    const envContent = `RANGE=${range}\n`;
    fs.writeFileSync(envFilePath, envContent, "utf8");
    return { name, range };
  }

  getRangeFromProfile(profileName) {
    const filePath = path.join(this.configDir, profileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      const match = content.match(/RANGE=(.*)/);
      return match ? match[1] : null;
    }
    return null;
  }

  getProfileNames() {
    return fs
      .readdirSync(this.configDir)
      .filter((file) => file.startsWith(".env."));
  }
}

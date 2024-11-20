// environment/EnvironmentStorageService.js
import fs from "fs";
import os from "os";
import path from "path";
import { REQUIRED_VARIABLES } from "../constants/index.js";

export class EnvironmentStorageService {
  constructor() {
    this.zshrcPath = path.join(os.homedir(), ".zshrc");
  }

  getEnvironmentVariable(key) {
    const zshrcValue = this.getFromZshrc(key);
    if (zshrcValue) return zshrcValue;
    return process.env[key];
  }

  getFromZshrc(key) {
    try {
      const content = fs.readFileSync(this.zshrcPath, "utf8");
      const match = content.match(new RegExp(`export ${key}=(.*)(\n|$)`));
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  checkEnvironmentVariables() {
    if (!fs.existsSync(this.zshrcPath)) {
      return false;
    }

    const zshrcContent = fs.readFileSync(this.zshrcPath, "utf8");
    const missingVariables = Object.values(REQUIRED_VARIABLES).filter(
      (variable) => {
        const regex = new RegExp(`export ${variable}=.*(\n|$)`, "g");
        return !regex.test(zshrcContent);
      }
    );

    return missingVariables.length === 0;
  }

  addEnvironmentVariables(variables) {
    try {
      let zshrcContent = fs.existsSync(this.zshrcPath)
        ? fs.readFileSync(this.zshrcPath, "utf8")
        : "";

      let changesMade = false;

      Object.entries(variables).forEach(([key, value]) => {
        const envVar = `export ${key}=${value}`;
        const regex = new RegExp(`export ${key}=.*(\n|$)`, "g");

        if (zshrcContent.includes(`export ${key}`)) {
          // Override existing variable
          zshrcContent = zshrcContent.replace(regex, `${envVar}\n`);
          changesMade = true;
        } else {
          // Add new variable
          zshrcContent += `\n${envVar}`;
          changesMade = true;
        }
      });

      if (changesMade) {
        fs.writeFileSync(this.zshrcPath, zshrcContent, "utf8");
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Error updating .zshrc: ${error.message}`);
    }
  }
}

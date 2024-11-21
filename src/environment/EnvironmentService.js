import chalk from "chalk";
import { google } from "googleapis";
import { REQUIRED_VARIABLES } from "../constants/index.js";
import fs from "fs";

export class EnvironmentService {
  constructor(storageService) {
    this.storageService = storageService;
    this.clientId = storageService.getEnvironmentVariable(
      REQUIRED_VARIABLES.GOOGLE_CLIENT_ID
    );
    this.clientSecret = storageService.getEnvironmentVariable(
      REQUIRED_VARIABLES.GOOGLE_CLIENT_SECRET
    );
    this.sheetId = storageService.getEnvironmentVariable(
      REQUIRED_VARIABLES.SHEET_ID
    );
  }

  async checkHasRequiredEnvironmentVariables() {
    const hasEnvironmentVariables =
      this.storageService.checkEnvironmentVariables();

    if (!hasEnvironmentVariables) {
      console.log(chalk.yellow("Run `env init` to use this command"));
      process.exit(1);
    }
  }

  async updateEnvironmentVariables(variables) {
    try {
      const changesMade =
        this.storageService.addEnvironmentVariables(variables);

      if (changesMade) {
        console.log(
          chalk.green("Environment variables have been added to .zshrc")
        );
        console.log(
          chalk.yellow(
            "Run `source ~/.zshrc` to apply the changes immediately."
          )
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update environment variables: ${error.message}`
      );
    }
  }

  async getEnvironmentVariables(authClient, fileName, range) {
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const spreadsheetId = this.sheetId;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;

      if (rows && rows.length) {
        const envDataArray = rows.flat();
        let envData = envDataArray.join("\n");
        envData = envData.replace(/\n+/g, "\n");
        fs.writeFileSync(fileName, envData);
      }

      console.log(chalk.green(`${fileName} files created successfully!`));
    } catch (error) {
      console.error("Error fetching sheet data:", error);
    }
  }
}

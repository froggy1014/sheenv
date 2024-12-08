import fs from "fs";
import chalk from "chalk";
import { google } from "googleapis";

export class EnvironmentService {
  async getEnvironmentVariables(authClient, fileName, range, sheetId) {
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const spreadsheetId = sheetId;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;

      if (rows?.length) {
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

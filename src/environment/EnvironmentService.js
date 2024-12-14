import fs from "fs";
import chalk from "chalk";
import { google } from "googleapis";

export class EnvironmentService {
  async getEnvironmentVariables(
    auth,
    fileName,
    range,
    spreadsheetId,
    sheetName,
  ) {
    try {
      const sheets = google.sheets({ version: "v4", auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${range}`,
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
      throw new Error(
        `Failed to fetch environment variables: ${error.message}`,
      );
    }
  }
}

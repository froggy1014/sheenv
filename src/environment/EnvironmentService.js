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
      process.exit(0);
    } catch (error) {
      throw new Error(
        `Failed to fetch environment variables: ${error.message}`,
      );
    }
  }

  async pushEnvironmentVariables(
    auth,
    fileName,
    range,
    spreadsheetId,
    sheetName,
  ) {
    try {
      if (!fs.existsSync(fileName)) {
        throw new Error(`File ${fileName} not found`);
      }

      const envContent = fs.readFileSync(fileName, "utf8");
      const envString = envContent
        .split("\n")
        .filter((line) => line.trim())
        .join("\n");

      const sheets = google.sheets({ version: "v4", auth });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: "RAW",
        resource: {
          values: [[envString]],
        },
      });

      console.log(
        chalk.green("Environment variables pushed to sheet successfully"),
      );
      process.exit(0);
    } catch (error) {
      throw new Error(`Failed to push environment variables: ${error.message}`);
    }
  }
}

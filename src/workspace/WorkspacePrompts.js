import chalk from "chalk";
import inquirer from "inquirer";

export class WorkspacePrompts {
  static async promptForCredentials() {
    console.log(
      chalk.yellow("\nBefore continuing, please make sure you have:"),
    );
    console.log("1. Created a project in Google Cloud Console");
    console.log("2. Enabled Google Sheets API");
    console.log("3. Enabled Google Drive API");
    console.log("4. Created OAuth 2.0 credentials\n");

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "clientId",
        message: "Enter Google OAuth Client ID:",
        validate: (input) => input.length > 0,
      },
      {
        type: "input",
        name: "clientSecret",
        message: "Enter Google OAuth Client Secret:",
        validate: (input) => input.length > 0,
      },
    ]);

    return answers;
  }

  static async promptForWorkspaceDetails(spreadsheets) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter workspace name:",
        validate: (input) => input.length > 0,
      },
      {
        type: "list",
        name: "spreadsheet",
        message: "Select Google Sheet:",
        choices: spreadsheets.map((sheet) => ({
          name: sheet.name,
          value: sheet.id,
        })),
      },
    ]);

    return {
      ...answers,
      sheetId: answers.spreadsheet,
    };
  }

  static async promptForSelectWorkspace(choices) {
    const { workspace } = await inquirer.prompt([
      {
        type: "list",
        name: "workspace",
        message: "Select workspace:",
        choices,
      },
    ]);

    return workspace;
  }
}

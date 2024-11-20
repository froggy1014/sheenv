import inquirer from "inquirer";
import chalk from "chalk";

export class EnvironmentPrompts {
  static async promptForEnvironmentVars() {
    return await inquirer.prompt([
      {
        type: "input",
        name: "ENV_SHEET_ID",
        message: "Enter Google Sheet ID:",
      },
      {
        type: "input",
        name: "ENV_GOOGLE_CLIENT_ID",
        message: "Enter Google Client ID:",
      },
      {
        type: "input",
        name: "ENV_GOOGLE_CLIENT_SECRET",
        message: "Enter Google Client Secret:",
      },
    ]);
  }

  static async promptForSelectProfile(profileList) {
    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "environments",
        message: chalk.white("Select the environments to generate .env files:"),
        choices: profileList,
      },
    ]);

    return answers.environments;
  }
}

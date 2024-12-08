import chalk from "chalk";
import inquirer from "inquirer";

export class EnvironmentPrompts {
  static async promptForSelectProfile(profileList) {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "environment",
        message: chalk.white("Select the environment to generate .env file:"),
        choices: profileList,
      },
    ]);

    return answers.environment;
  }
}

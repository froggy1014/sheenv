import inquirer from "inquirer";

export class WorkspacePrompts {
  static async promptForWorkspace() {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter workspace name:",
        validate: (input) => input.length > 0,
      },
      {
        type: "input",
        name: "sheetId",
        message: "Enter Google Sheet ID:",
        validate: (input) => input.length > 0,
      },
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

import inquirer from "inquirer";

export class ProfilePrompts {
  static async promptForProfile(sheetsList) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter profile name (lowercase with hyphens only):",
        validate: (input) => {
          if (input.length === 0) return false;
          if (!/^[a-z-]+$/.test(input)) {
            return "Only lowercase letters and hyphens are allowed";
          }
          return true;
        },
        filter: (input) => `.env.${input.toLowerCase()}`,
      },
      {
        type: "list",
        name: "sheet",
        message: "Select sheet:",
        choices: sheetsList.map((sheet) => sheet.trim()),
      },
      {
        type: "input",
        name: "range",
        message: "Enter range (e.g., A1:Z):",
        validate: (input) => input.length > 0,
      },
    ]);

    return answers;
  }
}

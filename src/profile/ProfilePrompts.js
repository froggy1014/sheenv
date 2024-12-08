import inquirer from "inquirer";

export class ProfilePrompts {
  static async promptForProfile() {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter profile name:",
        default: ".env.admin-local",
        validate: (input) => {
          if (!input.startsWith(".env.")) {
            return "Profile name must start with .env.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "sheet",
        message: "Enter sheet name:",
        default: "Sheet1",
        validate: (input) => {
          if (!input) {
            return "Sheet name is required";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "rangeType",
        message: "Select range type:",
        choices: [
          { name: "Single column (e.g., A:A)", value: "column" },
          { name: "Single cell (e.g., A1)", value: "cell" },
          { name: "Range (e.g., A1:B2)", value: "range" },
        ],
      },
      {
        type: "input",
        name: "range",
        message: "Enter range:",
      },
    ]);

    return {
      name: answers.name,
      sheet: answers.sheet,
      range: answers.range,
    };
  }
}
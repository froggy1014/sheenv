#!/usr/bin/env node

import { google } from "googleapis";
import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs";
import express from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import path from "path";
import os from "os";

dotenv.config();

const program = new Command();

const clientID = process.env.ICH_ENV_GOOGLE_CLIENT_ID;
const clientSecret = process.env.ICH_ENV_GOOGLE_CLIENT_SECRET;
const PORT = 1014;
const redirectURI = `http://localhost:${PORT}/oauth2callback`;

const oAuth2Client = new google.auth.OAuth2({
  clientId: clientID,
  clientSecret: clientSecret,
  redirectUri: redirectURI,
});

const TOKEN_PATH = ".token.json";

async function addEnvToZshrc() {
  const zshrcPath = path.join(os.homedir(), ".zshrc");

  // 1. 사용자에게 환경변수 입력을 요청
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "ICH_ENV_SHEET_ID",
      message: "Enter Google Sheet ID:",
    },
    {
      type: "input",
      name: "ICH_ENV_GOOGLE_CLIENT_ID",
      message: "Enter Google Client ID:",
    },
    {
      type: "input",
      name: "ICH_ENV_GOOGLE_CLIENT_SECRET",
      message: "Enter Google Client Secret:",
    },
  ]);

  const envVariables = [
    `export ICH_ENV_SHEET_ID=${answers.ICH_ENV_SHEET_ID}`,
    `export ICH_ENV_GOOGLE_CLIENT_ID=${answers.ICH_ENV_GOOGLE_CLIENT_ID}`,
    `export ICH_ENV_GOOGLE_CLIENT_SECRET=${answers.ICH_ENV_GOOGLE_CLIENT_SECRET}`,
  ];

  try {
    let zshrcContent = fs.existsSync(zshrcPath)
      ? fs.readFileSync(zshrcPath, "utf8")
      : "";

    let changesMade = false;

    envVariables.forEach((envVar) => {
      const [key] = envVar.split("=");

      if (!zshrcContent.includes(key)) {
        zshrcContent += `\n${envVar}`;
        changesMade = true;
      }
    });

    if (changesMade) {
      fs.writeFileSync(zshrcPath, zshrcContent, "utf8");
      console.log(
        chalk.green("Environment variables have been added to .zshrc")
      );
      console.log(
        chalk.yellow("Run `source ~/.zshrc` to apply the changes immediately.")
      );
    } else {
      console.log(
        chalk.blue("Environment variables are already present in .zshrc")
      );
    }
  } catch (error) {
    console.error(chalk.red("Error updating .zshrc:", error));
  }
}

function loadTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      oAuth2Client.setCredentials(tokens);
      console.log(chalk.yellow("Token loaded from file."));
      return true;
    } catch (error) {
      console.error(
        chalk.red("Error loading token, initiating new OAuth flow:", error)
      );
    }
  }
  return false;
}

function saveTokens(tokens) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens), "utf8");
  console.log("Tokens saved to file.");
}

async function validateTokens() {
  try {
    await oAuth2Client.getAccessToken();
    console.log(chalk.greenBright("Token is valid."));
    return true;
  } catch (error) {
    console.error(
      chalk.red("Token validation failed, initiating OAuth flow:", error)
    );
    return false;
  }
}

async function getGoogleAuthToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const open = (await import("open")).default;
  await open(authUrl);

  const app = express();
  const stop = spin("Waiting for authentication...");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stop();
      console.error(chalk.red("Authentication timed out. Please try again."));
      reject(new Error("Authentication timed out"));
    }, 60000); // 1-minute timeout

    app.get("/oauth2callback", async (req, res) => {
      clearTimeout(timeout); // Clear timeout if authentication is successful

      const code = req.query.code;
      if (!code) {
        res.send("Error: Authorization code not found");
        stop();
        console.error(chalk.red("Authorization code not found"));
        reject(new Error("Authorization code not found"));
        return;
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        saveTokens(tokens);
        stop();
        console.log("Tokens acquired:", tokens);
        res.send(`
          <html>
            <body>
              <p>Authentication successful!</p>
            </body>
          </html>
        `);
        resolve(tokens);
      } catch (error) {
        stop();
        console.error(chalk.red("Error retrieving access token", error));
        res.send("Error retrieving access token");
        reject(error);
      } finally {
        server.close();
      }
    });

    const server = app.listen(PORT, () => {
      console.log(
        `Listening on http://localhost:${PORT} for OAuth2 callback...`
      );
    });
  });
}

async function fetchSheetData(auth, envFileName) {
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.ICH_ENV_SHEET_ID;

  const range = "Sheet1!A1";

  const stop = spin(`Fetching data for ${envFileName}...`);
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (rows && rows.length) {
      const envData = rows.map((row) => `${row[0]}=${row[1]}`).join("\n");
      fs.writeFileSync(envFileName, envData);

      stop();
      console.log(
        chalk.blueBright(`${envFileName} 파일이 업데이트되었습니다.`)
      );
    } else {
      stop();
      console.log("No data found.");
    }
  } catch (error) {
    stop();
    console.error(chalk.red(`Error fetching data for ${envFileName}:`, error));
  }
}

async function chooseEnvironments() {
  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "environments",
      message: chalk.white("Select the environments to generate .env files:"),
      choices: [".env.local", ".env.dev", ".env.stg", ".env.production"],
    },
  ]);

  return answers.environments;
}

program
  .command("set-env")
  .description("Add environment variables to .zshrc")
  .action(() => {
    addEnvToZshrc();
  });

program
  .command("env")
  .description("Select environments and fetch Google Sheets data")
  .action(async () => {
    try {
      const envFileNames = await chooseEnvironments();

      if (!envFileNames.length) {
        console.log("No environment selected.");
        process.exit(1);
      }

      let stop;
      const tokensLoaded = loadTokens();
      const tokensValid = tokensLoaded ? await validateTokens() : false;

      if (!tokensLoaded || !tokensValid) {
        stop = spin("Authenticating...");
        const tokens = await getGoogleAuthToken();
        saveTokens(tokens);
        stop();
      }

      for (const envFileName of envFileNames) {
        await fetchSheetData(oAuth2Client, envFileName);
      }

      console.log(chalk.greenBright("Environment files created successfully!"));
      process.exit(0);
    } catch (error) {
      console.error(
        chalk.red("Error during environment selection or data fetching:", error)
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
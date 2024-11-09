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
import open from "open";
import { spin } from "tiny-spin";

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

// 필요한 환경 변수가 설정되어 있는지 확인하는 함수
function checkEnvVariables() {
  const requiredVars = ["ICH_ENV_SHEET_ID", "ICH_ENV_GOOGLE_CLIENT_ID", "ICH_ENV_GOOGLE_CLIENT_SECRET"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingVars.join(", ")}. Please run "env-sheet-cli set-env" first to configure the required variables.`
    );
  }
}

async function addEnvToZshrc() {
  const zshrcPath = path.join(os.homedir(), ".zshrc");

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
    let zshrcContent = fs.existsSync(zshrcPath) ? fs.readFileSync(zshrcPath, "utf8") : "";

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
      console.log(chalk.green("Environment variables have been added to .zshrc"));
      console.log(chalk.yellow("Run `source ~/.zshrc` to apply the changes immediately."));
    } else {
      console.log(chalk.blue("Environment variables are already present in .zshrc"));
    }
  } catch (error) {
    console.error(chalk.red("Error updating .zshrc:", error));
  }
}

async function getGoogleAuthToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  await open(authUrl);

  const app = express();

  const stop = spin("Waiting for authentication...");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stop();
      console.error(chalk.red("Authentication timed out. Please try again."));
      reject(new Error("Authentication timed out"));
    }, 30000);

    app.get("/oauth2callback", async (req, res) => {
      clearTimeout(timeout);

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
        stop();
        console.log("Tokens acquired:", tokens);
        res.send(`
          <html>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
              <h3>Environment Create Successfully. Please close this tab</h3>
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
      console.log(`Listening on http://localhost:${PORT} for OAuth2 callback...`);
    });
  });
}

async function fetchSheetData(auth, envFileName) {
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.ICH_ENV_SHEET_ID;

  let range;
  switch (envFileName) {
    case ".env.local":
      range = "Sheet1!A1";
      break;
    case ".env.dev":
      range = "Sheet1!B1";
      break;
    case ".env.stg":
      range = "Sheet1!C1";
      break;
    case ".env.production":
      range = "Sheet1!D1";
      break;
    default:
      throw new Error(`Unknown environment file name: ${envFileName}`);
  }

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
      console.log(chalk.blueBright(`${envFileName} 파일이 업데이트되었습니다.`));
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
      // 환경 변수 체크
      checkEnvVariables();

      const envFileNames = await chooseEnvironments();

      if (!envFileNames.length) {
        console.log("No environment selected.");
        process.exit(1);
      }

      const stop = spin("Authenticating...");
      await getGoogleAuthToken();
      stop();

      for (const envFileName of envFileNames) {
        await fetchSheetData(oAuth2Client, envFileName);
      }

      console.log(chalk.greenBright("Environment files created successfully!"));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red("Error:", error.message));
      process.exit(1);
    }
  });

program.parse(process.argv);
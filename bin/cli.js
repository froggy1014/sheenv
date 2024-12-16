#!/usr/bin/env node

import path from "path";
import { Command } from "commander";
import inquirer from "inquirer";

import chalk from "chalk";
import { spin } from "tiny-spin";

import { EnvironmentPrompts as envPrompts } from "../src/environment/EnvironmentPrompts.js";
import { EnvironmentService } from "../src/environment/EnvironmentService.js";

import fs from "fs/promises";
import { OAuthService } from "../src/oauth/OAuthService.js";
import { ProfilePrompts } from "../src/profile/ProfilePrompts.js";
import { SheetsService } from "../src/sheets/SheetsService.js";
import { WorkspacePrompts } from "../src/workspace/WorkspacePrompts.js";
import { WorkspaceService } from "../src/workspace/WorkspaceService.js";
import { WorkspaceStorageService } from "../src/workspace/WorkspaceStorageService.js";

const envService = new EnvironmentService();
const workspaceStorageService = new WorkspaceStorageService();
const workspaceService = new WorkspaceService(workspaceStorageService);

const program = new Command();

program
  .command("workspace")
  .description("Manage workspaces")
  .addCommand(
    new Command("add").description("Add new workspace").action(async () => {
      try {
        const credentials = await WorkspacePrompts.promptForCredentials();

        const oAuthService = new OAuthService(
          credentials.clientId,
          credentials.clientSecret,
        );
        const stop = spin("Authenticating with Google...");
        const authClient = await oAuthService.getAuthToken();
        stop();

        const sheetsService = new SheetsService(authClient);
        const fetchingStop = spin("Fetching your spreadsheets...");
        const spreadsheets = await sheetsService.getSpreadsheetsList();
        fetchingStop();

        if (spreadsheets.length === 0) {
          console.log(
            chalk.yellow("No spreadsheets found in your Google Drive"),
          );
          process.exit(1);
        }

        const workspaceDetails =
          await WorkspacePrompts.promptForWorkspaceDetails(spreadsheets);
        const result = await workspaceService.createWorkspace(
          workspaceDetails.name,
          workspaceDetails.sheetId,
          credentials.clientId,
          credentials.clientSecret,
        );
        console.log(
          chalk.green(`Workspace ${result.name} created successfully`),
        );
        process.exit(0);
      } catch (error) {
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    }),
  )
  .addCommand(
    new Command("export")
      .description("Export workspace configuration")
      .action(async () => {
        try {
          const workspaces = workspaceService.getWorkspaceNames();
          if (workspaces.length < 1) {
            console.log(
              chalk.yellow(
                "No workspaces found. Create one first with `sheenv workspace add`",
              ),
            );
            process.exit(1);
          }

          const workspaceName =
            await WorkspacePrompts.promptForSelectWorkspace(workspaces);
          const workspace = workspaceService.getWorkspace(workspaceName);

          const exportData = {
            name: workspace.name,
            sheetId: workspace.SHEET_ID,
            clientId: workspace.CLIENT_ID,
            clientSecret: workspace.CLIENT_ID_SECRET,
            profiles: workspace.profiles,
          };

          const desktopPath = `${
            process.env.HOME || process.env.USERPROFILE
          }/Desktop`;
          const fileName = `${desktopPath}/${workspaceName}.json`;
          await fs.writeFile(fileName, JSON.stringify(exportData, null, 2));
          console.log(chalk.green(`Workspace exported to ${fileName}`));
        } catch (error) {
          console.error(chalk.red(error.message));
        }
      }),
  )

  .addCommand(
    new Command("import")
      .description("Import workspace configuration")
      .action(async () => {
        try {
          const files = await fs.readdir(process.cwd());
          const jsonFiles = files.filter((file) => file.endsWith(".json"));

          if (jsonFiles.length === 0) {
            console.log(
              chalk.yellow("No JSON files found in current directory"),
            );
            process.exit(1);
          }

          const { selectedFile } = await inquirer.prompt([
            {
              type: "list",
              name: "selectedFile",
              message: "Select the configuration file to import:",
              choices: jsonFiles,
            },
          ]);

          const importFilePath = path.join(process.cwd(), selectedFile);
          const workspaceName = selectedFile.replace(".json", "");

          const fileContent = await fs.readFile(importFilePath, "utf8");
          const configData = JSON.parse(fileContent);

          const result = await workspaceService.createWorkspace(
            workspaceName,
            configData.sheetId,
            configData.clientId,
            configData.clientSecret,
            configData.authToken,
          );

          if (configData.profiles) {
            for (const profile of configData.profiles) {
              await workspaceService.addProfile(workspaceName, profile);
            }
          }

          console.log(
            chalk.green(`Workspace ${result.name} imported successfully`),
          );
        } catch (error) {
          console.error(chalk.red(error.message));
          if (error instanceof SyntaxError) {
            console.error(
              chalk.red("Invalid JSON format in configuration file"),
            );
          }
        }
      }),
  );

program
  .command("profile")
  .description("Manage environment profiles")
  .addCommand(
    new Command("add")
      .description("Add new environment profile")
      .action(async () => {
        try {
          const workspaces = workspaceService.getWorkspaceNames();
          if (workspaces.length < 1) {
            console.log(
              chalk.yellow(
                "Run `sheenv workspace add` to create a workspace first",
              ),
            );
            process.exit(1);
          }

          const workspaceName =
            await WorkspacePrompts.promptForSelectWorkspace(workspaces);
          const workspace = workspaceService.getWorkspace(workspaceName);

          const oAuthService = new OAuthService(
            workspace.CLIENT_ID,
            workspace.CLIENT_ID_SECRET,
          );
          const stop = spin("Authenticating...");
          const authClient = await oAuthService.getAuthToken();
          stop();

          // Save auth token to workspace
          await workspaceService.updateWorkspaceAuthToken(
            workspaceName,
            authClient.credentials,
          );

          const sheetsService = new SheetsService(authClient);
          const fetchingStop = spin("Fetching sheets list...");
          const sheetsList = await sheetsService.getSheetsList(
            workspace.SHEET_ID,
          );
          fetchingStop();

          if (sheetsList.length === 0) {
            console.log(chalk.yellow("No sheets found in this spreadsheet"));
            process.exit(1);
          }

          const profileData = await ProfilePrompts.promptForProfile(sheetsList);
          const result = await workspaceService.addProfile(workspaceName, {
            name: profileData.name,
            sheet: profileData.sheet,
            range: profileData.range,
          });

          console.log(
            chalk.green(`Profile ${result.name} created successfully`),
          );

          process.exit(0);
        } catch (error) {
          console.error(chalk.red(error.message));
          process.exit(1);
        }
      }),
  );

program
  .command("env")
  .description("Manage environment variables")
  .addCommand(
    new Command("pull")
      .description("Fetch environment variables from Google Sheets")
      .action(async () => {
        try {
          const workspaces = workspaceService.getWorkspaceNames();
          if (workspaces.length < 1) {
            console.log(
              chalk.yellow(
                "Run `sheenv workspace add` to create a workspace first",
              ),
            );
            process.exit(1);
          }

          const workspaceName =
            await WorkspacePrompts.promptForSelectWorkspace(workspaces);
          const workspace = workspaceService.getWorkspace(workspaceName);

          const profiles = workspace.profiles;
          if (profiles.length < 1) {
            console.log(
              chalk.yellow(
                "Run `sheenv profile add` to create a profile first",
              ),
            );
            process.exit(1);
          }

          const profileChoices = profiles.map((p) => p.name);
          const selectedProfile =
            await envPrompts.promptForSelectProfile(profileChoices);
          const profile = profiles.find((p) => p.name === selectedProfile);

          const oAuthService = new OAuthService(
            workspace.CLIENT_ID,
            workspace.CLIENT_ID_SECRET,
          );

          let authClient;
          if (workspace.authToken) {
            authClient = await oAuthService.getAuthTokenFromCredentials(
              workspace.authToken,
            );
          } else {
            const stop = spin("Authenticating...");
            authClient = await oAuthService.getAuthToken();
            await workspaceService.updateWorkspaceAuthToken(
              workspaceName,
              authClient.credentials,
            );
            stop();
          }

          await envService.getEnvironmentVariables(
            authClient,
            profile.name,
            profile.range,
            workspace.SHEET_ID,
            profile.sheet,
          );

          process.exit(0);
        } catch (error) {
          console.error(chalk.red("Error:", error.message));
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command("push")
      .description("Push environment variables to Google Sheets")
      .action(async () => {
        try {
          const workspaces = workspaceService.getWorkspaceNames();
          if (workspaces.length < 1) {
            console.log(
              chalk.yellow(
                "Run `sheenv workspace add` to create a workspace first",
              ),
            );
            process.exit(1);
          }

          const workspaceName =
            await WorkspacePrompts.promptForSelectWorkspace(workspaces);
          const workspace = workspaceService.getWorkspace(workspaceName);

          const profiles = workspace.profiles;
          if (profiles.length < 1) {
            console.log(
              chalk.yellow(
                "Run `sheenv profile add` to create a profile first",
              ),
            );
            process.exit(1);
          }

          const profileChoices = profiles.map((p) => p.name);
          const selectedProfile =
            await envPrompts.promptForSelectProfile(profileChoices);
          const profile = profiles.find((p) => p.name === selectedProfile);

          const oAuthService = new OAuthService(
            workspace.CLIENT_ID,
            workspace.CLIENT_ID_SECRET,
          );

          let authClient;
          if (workspace.authToken) {
            authClient = await oAuthService.getAuthTokenFromCredentials(
              workspace.authToken,
            );
          } else {
            const stop = spin("Authenticating...");
            authClient = await oAuthService.getAuthToken();
            await workspaceService.updateWorkspaceAuthToken(
              workspaceName,
              authClient.credentials,
            );
            stop();
          }

          await envService.pushEnvironmentVariables(
            authClient,
            profile.name,
            profile.range,
            workspace.SHEET_ID,
            profile.sheet,
          );

          process.exit(0);
        } catch (error) {
          console.error(chalk.red("Error:", error.message));
          process.exit(1);
        }
      }),
  );

program.parse(process.argv);

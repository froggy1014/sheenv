#!/usr/bin/env node

import { Command } from "commander";

import chalk from "chalk";
import { spin } from "tiny-spin";

import { EnvironmentPrompts as envPrompts } from "../src/environment/EnvironmentPrompts.js";
import { EnvironmentService } from "../src/environment/EnvironmentService.js";

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
        const workspaceData = await WorkspacePrompts.promptForWorkspace();
        const result = await workspaceService.createWorkspace(
          workspaceData.name,
          workspaceData.sheetId,
          workspaceData.clientId,
          workspaceData.clientSecret,
        );
        console.log(
          chalk.green(`Workspace ${result.name} created successfully`),
        );
      } catch (error) {
        console.error(chalk.red(error.message));
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
        } catch (error) {
          console.error(chalk.red(error.message));
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

          const stop = spin("Authenticating...");
          const authClient = await oAuthService.getAuthToken();
          stop();

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
  );

program.parse(process.argv);

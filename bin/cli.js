#!/usr/bin/env node

import { Command } from "commander";

import path, { dirname } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { spin } from "tiny-spin";

import { EnvironmentPrompts as envPrompts } from "../src/environment/EnvironmentPrompts.js";
import { EnvironmentService } from "../src/environment/EnvironmentService.js";

import { OAuthService } from "../src/oauth/OAuthService.js";
import { ProfilePrompts } from "../src/profile/ProfilePrompts.js";
import { ProfileService } from "../src/profile/ProfileService.js";
import { ProfileStorageService } from "../src/profile/ProfileStorageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const profilesDir = path.resolve(__dirname, "profiles");

const envService = new EnvironmentService();
const storageService = new ProfileStorageService(profilesDir);
const profileService = new ProfileService(storageService);

const program = new Command();

program
  .command("profile")
  .description("Manage environment profiles")
  .addCommand(
    new Command("add")
      .description("Add new environment profile")
      .action(async () => {
        try {
          const profileData = await ProfilePrompts.promptForProfile();
          const result = await profileService.createProfile(
            profileData.name,
            profileData.sheet,
            profileData.range,
            profileData.sheetId,
            profileData.clientId,
            profileData.clientIdSecret,
          );
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
          const choices = storageService.getProfileNames();

          if (choices.length < 1) {
            console.log(
              chalk.yellow("Run `sheenv profile add` to use this command"),
            );
            process.exit(1);
          }

          const envFileName = await envPrompts.promptForSelectProfile(choices);

          const { RANGE, SHEET_ID, CLIENT_ID, CLIENT_ID_SECRET } =
            storageService.getProfile(envFileName);

          const oAuthService = new OAuthService(CLIENT_ID, CLIENT_ID_SECRET);

          const stop = spin("Authenticating...");
          const authClient = await oAuthService.getAuthToken();
          stop();

          if (!RANGE) {
            console.error("Invalid profile format.");
            return;
          }

          await envService.getEnvironmentVariables(
            authClient,
            envFileName,
            RANGE,
            SHEET_ID,
          );

          process.exit(0);
        } catch (error) {
          console.error(chalk.red("Error:", error.message));
          process.exit(1);
        }
      }),
  );

program.parse(process.argv);

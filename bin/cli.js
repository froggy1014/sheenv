#!/usr/bin/env node

import { Command } from "commander";

import chalk from "chalk";
import path, { dirname } from "path";
import { spin } from "tiny-spin";
import { fileURLToPath } from "url";

import { EnvironmentPrompts as envPrompts } from "../src/environment/EnvironmentPrompts.js";
import { EnvironmentService } from "../src/environment/EnvironmentService.js";
import { EnvironmentStorageService } from "../src/environment/EnvironmentStorageService.js";

import { OAuthService } from "../src/oauth/OAuthService.js";
import { ProfilePrompts } from "../src/profile/ProfilePrompts.js";
import { ProfileService } from "../src/profile/ProfileService.js";
import { ProfileStorageService } from "../src/profile/ProfileStorageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const profilesDir = path.resolve(__dirname, "profiles");

const envStorageService = new EnvironmentStorageService();
const envService = new EnvironmentService(envStorageService);
const storageService = new ProfileStorageService(profilesDir);
const profileService = new ProfileService(storageService);

const oAuthService = new OAuthService(
  envService.clientId,
  envService.clientSecret
);

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
            profileData.range
          );
          console.log(
            chalk.green(`Profile ${result.name} created successfully`)
          );
        } catch (error) {
          console.error(chalk.red(error.message));
        }
      })
  );

program
  .command("env")
  .description("Manage environment variables")
  .addCommand(
    new Command("pull")
      .description("Fetch environment variables from Google Sheets")
      .action(async () => {
        try {
          await envService.checkHasRequiredEnvironmentVariables();

          const choices = storageService.getProfileNames();

          if (choices.length < 1) {
            console.log(
              chalk.yellow(
                "Run `env-sheet-cli profile add` to use this command"
              )
            );
            process.exit(1);
          }

          const envFileNames = await envPrompts.promptForSelectProfile(choices);

          if (!envFileNames.length) {
            console.log("No environment selected.");
            process.exit(1);
          }

          const stop = spin("Authenticating...");
          const authClient = await oAuthService.getAuthToken();
          stop();

          for (const envFileName of envFileNames) {
            const range = storageService.getRangeFromProfile(envFileName);

            if (!range) {
              console.error("Invalid profile format.");
              return;
            }

            await envService.getEnvironmentVariables(
              authClient,
              envFileName,
              range
            );
          }

          process.exit(0);
        } catch (error) {
          console.error(chalk.red("Error:", error.message));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("init")
      .description("Initialize environment variables in .zshrc")
      .action(async () => {
        try {
          const variables = await envPrompts.promptForEnvironmentVars();
          await envService.updateEnvironmentVariables(variables);
        } catch (error) {
          console.error(chalk.red(error.message));
        }
      })
  );

program.parse(process.argv);

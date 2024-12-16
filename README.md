# sheenv

<p align="center">
  <img src="./public/sheenv.png" alt="sheenv">
</p>

> CLI tool for managing environment variables using Google Sheets.

## Installation

```bash
npm install -g sheenv
```

## Prerequisites

Before using sheenv, you need to:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
3. Create OAuth 2.0 credentials (Client ID & Client Secret)
4. Set up your Google Sheet with environment variables

## Usage

### Workspace Management

Workspaces help you organize different Google Sheets configurations.

```bash
# Create a new workspace
sheenv workspace add

# Export workspace configuration
sheenv workspace export

# Import workspace configuration
sheenv workspace import
```

### Profile Management

Profiles allow you to manage different environment variable sets within a workspace.

```bash
# Add new profile to a workspace
sheenv profile add
```

Example profile structure:

```
workspace
└── profiles
    ├── .env.local
    ├── .env.dev
    └── .env.prod
```

### Environment Variables

```bash
# Pull environment variables from Google Sheets
sheenv env pull

# Push local environment variables to Google Sheets
sheenv env push
```

## Command Details

### `workspace add`

1. Prompts for Google OAuth credentials
2. Authenticates with Google
3. Shows list of available Google Sheets
4. Creates a workspace with selected sheet

### `workspace export`

1. Exports workspace configuration to Desktop
2. Includes:
   - Sheet ID
   - OAuth credentials
   - Profiles

### `workspace import`

1. Imports workspace configuration from a JSON file
2. Restores all profiles and settings

### `profile add`

1. Select a workspace
2. Authenticate with Google
3. Select a sheet from the spreadsheet
4. Configure range for environment variables
5. Creates a new profile

### `env pull`

1. Select a workspace
2. Select a profile
3. Pulls environment variables from configured sheet
4. Creates .env file with the variables

## File Structure

Environment files are stored in:

```
~/.config/sheenv/
└── workspaces/
    └── [workspace-name].json
```

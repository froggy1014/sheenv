import express from "express";
import { google } from "googleapis";
import open from "open";
import { spin } from "tiny-spin";

export class OAuthService {
  constructor(clientId, clientSecret) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost:3000/oauth2callback",
    );
    this.scopes = [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ];
  }

  async getAuthToken() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.scopes,
    });

    await open(authUrl);
    const app = express();
    const stop = spin("Waiting for authentication...");

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stop();
        reject(new Error("Authentication timed out"));
      }, 30000);

      app.get("/oauth2callback", async (req, res) => {
        clearTimeout(timeout);
        const { code } = req.query;

        if (!code) {
          stop();
          res.send("Error: Authorization code not found");
          reject(new Error("Authorization code not found"));
          return;
        }

        try {
          const { tokens } = await this.oauth2Client.getToken(code);
          this.oauth2Client.setCredentials(tokens);
          stop();
          res.send(`
            <html>
              <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <h3>Authentication successful! Please close this window</h3>
              </body>
            </html>
          `);
          resolve(this.oauth2Client);
        } catch (error) {
          stop();
          res.send("Error retrieving access token");
          reject(error);
        } finally {
          server.close();
        }
      });

      const server = app.listen(3000);
    });
  }

  async getAuthTokenFromCredentials(credentials) {
    try {
      this.oauth2Client.setCredentials(credentials);
      await this.oauth2Client.getAccessToken();
      return this.oauth2Client;
    } catch (error) {
      return this.getAuthToken();
    }
  }
}

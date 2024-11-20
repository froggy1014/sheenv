import { google } from "googleapis";
import express from "express";
import open from "open";
import { spin } from "tiny-spin";
import { OAuthConfig } from "./OauthConfig.js";

export class OAuthService {
  constructor(clientId, clientSecret) {
    this.oAuth2Client = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri: OAuthConfig.redirectURI,
    });
  }

  async getAuthToken() {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: OAuthConfig.scopes,
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
          const { tokens } = await this.oAuth2Client.getToken(code);
          this.oAuth2Client.setCredentials(tokens);
          stop();
          res.send(`
            <html>
              <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <h3>Environment Create Successfully. Please close this tab</h3>
              </body>
            </html>
          `);
          resolve(this.oAuth2Client);
        } catch (error) {
          stop();
          res.send("Error retrieving access token");
          reject(error);
        } finally {
          server.close();
        }
      });

      const server = app.listen(OAuthConfig.PORT);
    });
  }

  getClient() {
    return this.oAuth2Client;
  }
}

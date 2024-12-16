import http from "http";
import url from "url";
import express from "express";
import { google } from "googleapis";
import open from "open";
import { spin } from "tiny-spin";
import { OAuthConfig } from "./OauthConfig.js";

export class OAuthService {
  constructor(clientId, clientSecret) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost:3000/oauth2callback",
    );
  }

  async getAuthToken() {
    const authUrl = this.oauth2Client.generateAuthUrl({
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
          const { tokens } = await this.oauth2Client.getToken(code);
          this.oauth2Client.setCredentials(tokens);
          stop();
          res.send(`
            <html>
              <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <h3>Environment Create Successfully. Please close this tab</h3>
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

      const server = app.listen(OAuthConfig.PORT);
    });
  }

  async getAuthTokenFromCredentials(credentials) {
    try {
      this.oauth2Client.setCredentials(credentials);
      // Verify token is still valid
      await this.oauth2Client.getAccessToken();
      return this.oauth2Client;
    } catch (error) {
      // If token is expired or invalid, get new token
      return this.getAuthToken();
    }
  }

  getAuthorizationCode() {
    return new Promise((resolve, reject) => {
      const server = http
        .createServer(async (req, res) => {
          try {
            const queryObject = url.parse(req.url, true).query;
            const code = queryObject.code;
            res.end("Authentication successful! You can close this window.");
            server.close();
            resolve(code);
          } catch (error) {
            reject(error);
          }
        })
        .listen(3000);
    });
  }

  getClient() {
    return this.oauth2Client;
  }
}

export class OAuthConfig {
  static PORT = 1014;

  static get redirectURI() {
    return `http://localhost:${OAuthConfig.PORT}/oauth2callback`;
  }

  static get scopes() {
    return ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  }
}

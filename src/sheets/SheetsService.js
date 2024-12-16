import { google } from "googleapis";

export class SheetsService {
  constructor(auth) {
    this.sheets = google.sheets({ version: "v4", auth });
    this.drive = google.drive({ version: "v3", auth });
  }

  async getSpreadsheetsList() {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: "files(id, name)",
        orderBy: "modifiedTime desc",
      });

      return response.data.files.map((file) => ({
        name: file.name,
        id: file.id,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch spreadsheets list: ${error.message}`);
    }
  }

  async getSheetsList(spreadsheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties.title",
      });

      return response.data.sheets.map((sheet) => sheet.properties.title.trim());
    } catch (error) {
      throw new Error(`Failed to fetch sheets list: ${error.message}`);
    }
  }
}

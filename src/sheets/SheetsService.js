import { google } from "googleapis";

export class SheetsService {
  constructor(auth) {
    this.sheets = google.sheets({ version: "v4", auth });
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

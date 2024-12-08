export class ProfileService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  async createProfile(name, sheet, range, sheetId, clientId, clientIdSecret) {
    const fullRange = `${sheet}!${range}`;
    return this.storageService.saveProfile(
      name,
      fullRange,
      sheetId,
      clientId,
      clientIdSecret,
    );
  }
}

export class ProfileService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  async createProfile(name, sheet, range) {
    this.validateRange(range);
    const fullRange = `${sheet}!${range}`;
    return this.storageService.saveProfile(name, fullRange);
  }

  validateRange(range) {
    if (!/^[A-Za-z]+[0-9]*(:[A-Za-z]+[0-9]*)?$/.test(range)) {
      throw new Error("Invalid range format.");
    }
  }
}

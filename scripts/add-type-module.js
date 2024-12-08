const fs = require("fs");
const path = require("path");

// Use the absolute path to package.json
const packageJsonPath = path.resolve(__dirname, "../package.json");

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Modify package.json as needed
  packageJson.type = "module";

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json updated with "type": "module"');
} catch (error) {
  console.error("Error reading or writing package.json:", error);
}

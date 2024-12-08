// scripts/add-type-module.js
const fs = require("fs");
const path = require("path");

// Get the path to the package.json
const packageJsonPath = path.resolve(__dirname, "../package.json");

try {
  // Read the current package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Add the "type": "module" property if not already there
  if (!packageJson.type) {
    packageJson.type = "module";
  }

  // Write the updated package.json back to disk
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log('Successfully added "type": "module" to package.json');
} catch (error) {
  console.error("Error modifying package.json:", error);
}

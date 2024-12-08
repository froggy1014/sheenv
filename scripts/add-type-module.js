import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
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

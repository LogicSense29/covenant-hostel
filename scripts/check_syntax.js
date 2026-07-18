const path = require("path");
const fs = require("fs");

try {
  const code = fs.readFileSync(path.join(__dirname, "../src/app/api/cron/rent-reminders/route.js"), "utf8");
  // Check for syntax errors by parsing it
  const { parse } = require("acorn");
  parse(code, { ecmaVersion: "latest", sourceType: "module" });
  console.log("Syntax OK");
} catch (e) {
  console.error("Syntax Error:", e);
}

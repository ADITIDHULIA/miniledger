// Prepares the isolated test database before running tests.
// Safety: refuses to run unless TEST_DATABASE_URL points at a database whose name ends in "_test".
import "dotenv/config";
import { execSync } from "child_process";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
if (!/\/[^/?]*_test(\?|$)/.test(url)) throw new Error("TEST_DATABASE_URL must point to a database ending in _test");

if (process.env.SKIP_MIGRATE !== "1") {
  console.log("Applying migrations to the test database...");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}

import { config } from "./config";
import { createApp } from "./app";

// Listen on all interfaces so a physical phone on the same Wi-Fi can reach the API.
createApp().listen(config.port, "0.0.0.0", () => {
  console.log(`MiniLedger API listening on http://0.0.0.0:${config.port}`);
  console.log("Mock OTPs will be printed in this terminal.");
});

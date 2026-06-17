import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, "0.0.0.0", () => {
  console.log("");
  console.log("======================================");
  console.log(" StreamPilot API running");
  console.log("======================================");
  console.log(` API: http://localhost:${env.PORT}`);
  console.log(` Health: http://localhost:${env.PORT}/health`);
  console.log(" Storage: Google Sheets");
  console.log("======================================");
  console.log("");
});

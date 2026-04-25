import "dotenv/config";
import express from "express";
import cors from "cors";

import teamRoutes from "./routes/team.routes.js";
import userRoutes from "./routes/user.routes.js";
import slackRoutes from "./routes/slack.routes.js";
import { initDB } from "./lib/db.js";

async function startServer() {
  await initDB();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Piper API is running 🚀");
  });

  app.use("/api/slack", slackRoutes);
  app.use("/api/teams", teamRoutes);
  app.use("/api/users", userRoutes);

  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Prevent GC edge cases
  server.keepAliveTimeout = 60000;
}

process.on("exit", (code) => {
  console.trace("EXIT CALLED HERE");
});
startServer();

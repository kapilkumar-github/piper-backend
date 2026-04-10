import "dotenv/config";
import express from "express";
import cors from "cors";

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import teamRoutes from "./routes/team.routes.js";
import userRoutes from "./routes/user.routes.js";
import slackRoutes from "./routes/slack.routes.js";
import { initDB } from "./lib/db.js";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";
import {
  interactions,
  events,
  installation,
  mockSlackInstallFlow,
  options,
} from "../controllers/slack.controller.js";

const router = express.Router();

router.post(
  "/interactions",
  express.urlencoded({ extended: true }),
  interactions,
);

router.post("/events", events);
router.post("/options", express.urlencoded({ extended: true }), options);

router.get("/install", mockSlackInstallFlow);
router.get("/callback", installation);

router.get("/success", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding: 60px;">
        <h2>Piper installed successfully</h2>
        <p>You can close this tab and open Slack.</p>
      </body>
    </html>
  `);
});

router.get("/error", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding: 60px;">
        <h2>Something went wrong</h2>
        <p>Please try installing again.</p>
      </body>
    </html>
  `);
});

export default router;

import express from "express";
import {
  createTeam,
  joinTeam,
  assignRole,
} from "../controllers/team.controller.js";

const router = express.Router();

router.post("/create", createTeam);
router.post("/join", joinTeam);
router.post("/assign-role", assignRole);

export default router;

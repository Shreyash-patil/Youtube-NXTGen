import express from "express";
import {
  getallwatchlater,
  handlewatchlater,
  removewatchlater,
} from "../controllers/watchlater.js";

const routes = express.Router();
routes.get("/:userId", getallwatchlater);
routes.delete("/:watchLaterId", removewatchlater);
routes.post("/:videoId", handlewatchlater);
export default routes;

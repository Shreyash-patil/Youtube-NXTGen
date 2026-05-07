import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
  removehistoryitem,
} from "../controllers/history.js";

const routes = express.Router();
routes.get("/:userId", getallhistoryVideo);
routes.delete("/:historyId", removehistoryitem);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", handlehistory);
export default routes;

import express from "express";
import {
  getallLikedVideo,
  getlikestatus,
  handlelike,
  removelikedvideo,
} from "../controllers/like.js";

const routes = express.Router();
routes.get("/:userId", getallLikedVideo);
routes.get("/status/:videoId/:userId", getlikestatus);
routes.delete("/:likeId", removelikedvideo);
routes.post("/:videoId", handlelike);
export default routes;

import express from "express";
import {
  getallvideo,
  getVideoById,
  getuserdownloads,
  handledownloadvideo,
  removedownload,
  uploadvideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/:id", getVideoById);
routes.post("/download/:videoId", handledownloadvideo);
routes.get("/downloads/:userId", getuserdownloads);
routes.delete("/download/:downloadId", removedownload);
export default routes;

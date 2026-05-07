import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  likecomment,
  dislikecomment,
  translatecomment,
  getvotestatus,
} from "../controllers/comment.js";

const routes = express.Router();
routes.post("/postcomment", postcomment);
routes.post("/editcomment/:id", editcomment);
routes.post("/like/:commentId", likecomment);
routes.post("/dislike/:commentId", dislikecomment);
routes.post("/translate/:commentId", translatecomment);
routes.post("/votes", getvotestatus);
routes.delete("/deletecomment/:id", deletecomment);
// Generic catch-all GET must come last
routes.get("/:videoid", getallcomment);
export default routes;

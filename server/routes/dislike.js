import express from "express";
import { handledislike, getdislikestatus } from "../controllers/dislike.js";

const routes = express.Router();
routes.post("/:videoId", handledislike);
routes.get("/status/:videoId/:userId", getdislikestatus);

export default routes;

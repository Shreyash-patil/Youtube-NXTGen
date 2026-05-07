import express from "express";
import {
  createplanorder,
  getplanlimits,
  getsubscriptionstatus,
  getsubscribedchannels,
  getuserbyid,
  login,
  searchusers,
  togglesubscription,
  updateprofile,
  verifyplanpayment,
} from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.post("/plan/order", createplanorder);
routes.post("/plan/verify", verifyplanpayment);
routes.get("/plan/:userId", getplanlimits);
routes.post("/subscribe/:channelId", togglesubscription);
routes.get("/subscribe/status/:channelId/:userId", getsubscriptionstatus);
routes.get("/subscriptions/:userId", getsubscribedchannels);
routes.get("/search", searchusers);
routes.get("/:id", getuserbyid);
export default routes;

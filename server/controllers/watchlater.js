import watchlater from "../Modals/watchlater.js";
import mongoose from "mongoose";

export const handlewatchlater = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    const exisitingwatchlater = await watchlater.findOne({
      viewer: userId,
      videoid: videoId,
    });
    if (exisitingwatchlater) {
      await watchlater.findByIdAndDelete(exisitingwatchlater._id);
      return res.status(200).json({ watchlater: false });
    } else {
      await watchlater.create({ viewer: userId, videoid: videoId });
      return res.status(200).json({ watchlater: true });
    }
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallwatchlater = async (req, res) => {
  const { userId } = req.params;
  try {
    const watchlatervideo = await watchlater
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(watchlatervideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removewatchlater = async (req, res) => {
  const { watchLaterId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(watchLaterId)) {
    return res.status(400).json({ message: "Invalid watch later id" });
  }
  try {
    await watchlater.findByIdAndDelete(watchLaterId);
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

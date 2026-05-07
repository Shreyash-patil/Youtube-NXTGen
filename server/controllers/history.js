import video from "../Modals/video.js";
import history from "../Modals/history.js";
import mongoose from "mongoose";

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    await history.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      { $set: { watchedon: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ viewed: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const historyvideo = await history
      .find({ viewer: userId })
      .sort({ watchedon: -1 })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();

    const seen = new Set();
    const uniqueHistory = historyvideo.filter((item) => {
      const id = item.videoid?._id?.toString();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return res.status(200).json(uniqueHistory);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removehistoryitem = async (req, res) => {
  const { historyId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(historyId)) {
    return res.status(400).json({ message: "Invalid history id" });
  }
  try {
    await history.findByIdAndDelete(historyId);
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

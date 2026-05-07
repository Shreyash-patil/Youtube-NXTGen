import video from "../Modals/video.js";
import like from "../Modals/like.js";
import dislike from "../Modals/dislike.js";
import mongoose from "mongoose";

export const handlelike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    const exisitinglike = await like.findOne({
      viewer: userId,
      videoid: videoId,
    });
    if (exisitinglike) {
      await like.findByIdAndDelete(exisitinglike._id);
      const updatedVideo = await video.findByIdAndUpdate(
        videoId,
        { $inc: { Like: -1 } },
        { new: true }
      );
      return res.status(200).json({
        liked: false,
        Like: Math.max(updatedVideo?.Like || 0, 0),
        Dislike: updatedVideo?.Dislike || 0,
      });
    } else {
      // If user already disliked it, remove dislike first (mutual exclusive)
      const existingDislike = await dislike.findOne({
        viewer: userId,
        videoid: videoId,
      });
      if (existingDislike) {
        await dislike.findByIdAndDelete(existingDislike._id);
        await video.findByIdAndUpdate(videoId, { $inc: { Dislike: -1 } });
      }

      await like.create({ viewer: userId, videoid: videoId });
      const updatedVideo = await video.findByIdAndUpdate(
        videoId,
        { $inc: { Like: 1 } },
        { new: true }
      );
      return res.status(200).json({
        liked: true,
        Like: updatedVideo?.Like || 0,
        Dislike: Math.max(updatedVideo?.Dislike || 0, 0),
      });
    }
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const likevideo = await like
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removelikedvideo = async (req, res) => {
  const { likeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(likeId)) {
    return res.status(400).json({ message: "Invalid like id" });
  }
  try {
    const existing = await like.findById(likeId);
    if (!existing) {
      return res.status(404).json({ message: "Like not found" });
    }
    await like.findByIdAndDelete(likeId);
    await video.findByIdAndUpdate(existing.videoid, { $inc: { Like: -1 } });
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getlikestatus = async (req, res) => {
  const { videoId, userId } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    const existing = await like.findOne({ viewer: userId, videoid: videoId });
    return res.status(200).json({ liked: !!existing });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

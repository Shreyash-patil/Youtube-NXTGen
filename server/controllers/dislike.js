import video from "../Modals/video.js";
import dislike from "../Modals/dislike.js";
import like from "../Modals/like.js";
import mongoose from "mongoose";

export const handledislike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const existingDislike = await dislike.findOne({
      viewer: userId,
      videoid: videoId,
    });

    if (existingDislike) {
      await dislike.findByIdAndDelete(existingDislike._id);
      const updatedVideo = await video.findByIdAndUpdate(
        videoId,
        { $inc: { Dislike: -1 } },
        { new: true }
      );
      return res.status(200).json({
        disliked: false,
        Like: updatedVideo?.Like || 0,
        Dislike: Math.max(updatedVideo?.Dislike || 0, 0),
      });
    }

    // If user already liked it, remove like first (mutual exclusive)
    const existingLike = await like.findOne({ viewer: userId, videoid: videoId });
    if (existingLike) {
      await like.findByIdAndDelete(existingLike._id);
      await video.findByIdAndUpdate(videoId, { $inc: { Like: -1 } });
    }

    await dislike.create({ viewer: userId, videoid: videoId });
    const updatedVideo = await video.findByIdAndUpdate(
      videoId,
      { $inc: { Dislike: 1 } },
      { new: true }
    );
    return res.status(200).json({
      disliked: true,
      Like: updatedVideo?.Like || 0,
      Dislike: updatedVideo?.Dislike || 0,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getdislikestatus = async (req, res) => {
  const { videoId, userId } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    const existing = await dislike.findOne({ viewer: userId, videoid: videoId });
    return res.status(200).json({ disliked: !!existing });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

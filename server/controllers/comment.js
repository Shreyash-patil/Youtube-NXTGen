import comment from "../Modals/comment.js";
import commentvote from "../Modals/commentvote.js";
import mongoose from "mongoose";

// Characters that are blocked in comments
// Allows: letters (any language), numbers, spaces, basic punctuation (.,!?-'":;), emojis
const SPECIAL_CHAR_REGEX = /[~@#$%^&*()_+={}[\]|\\<>`]/;

const hasSpecialChars = (text) => SPECIAL_CHAR_REGEX.test(text);

export const postcomment = async (req, res) => {
  const commentdata = req.body;

  // Block comments with special characters
  if (hasSpecialChars(commentdata.commentbody || "")) {
    return res.status(400).json({
      message:
        "Comment contains special characters that are not allowed. Please remove characters like @#$%^&*()_+={}[]|\\<>` and try again.",
      blocked: true,
    });
  }

  const postcomment = new comment(commentdata);
  try {
    await postcomment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment
      .find({ videoid: videoid })
      .sort({ commentedon: -1 });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    // Clean up any votes for this comment
    await commentvote.deleteMany({ commentId: _id });
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }

  // Block edits with special characters too
  if (hasSpecialChars(commentbody || "")) {
    return res.status(400).json({
      message:
        "Comment contains special characters that are not allowed. Please remove characters like @#$%^&*()_+={}[]|\\<>` and try again.",
      blocked: true,
    });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likecomment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(commentId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const existing = await commentvote.findOne({
      userId,
      commentId,
    });

    if (existing && existing.type === "like") {
      // Already liked → remove the like (toggle off)
      await commentvote.findByIdAndDelete(existing._id);
      const updated = await comment.findByIdAndUpdate(
        commentId,
        { $inc: { likes: -1 } },
        { new: true }
      );
      return res.status(200).json({
        likes: Math.max(updated?.likes || 0, 0),
        dislikes: Math.max(updated?.dislikes || 0, 0),
        userVote: null,
      });
    }

    if (existing && existing.type === "dislike") {
      // Was disliked → switch to like
      existing.type = "like";
      await existing.save();
      const updated = await comment.findByIdAndUpdate(
        commentId,
        { $inc: { likes: 1, dislikes: -1 } },
        { new: true }
      );
      return res.status(200).json({
        likes: Math.max(updated?.likes || 0, 0),
        dislikes: Math.max(updated?.dislikes || 0, 0),
        userVote: "like",
      });
    }

    // No existing vote → create like
    await commentvote.create({ userId, commentId, type: "like" });
    const updated = await comment.findByIdAndUpdate(
      commentId,
      { $inc: { likes: 1 } },
      { new: true }
    );
    return res.status(200).json({
      likes: Math.max(updated?.likes || 0, 0),
      dislikes: Math.max(updated?.dislikes || 0, 0),
      userVote: "like",
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikecomment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(commentId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const existing = await commentvote.findOne({
      userId,
      commentId,
    });

    if (existing && existing.type === "dislike") {
      // Already disliked → remove the dislike (toggle off)
      await commentvote.findByIdAndDelete(existing._id);
      const updated = await comment.findByIdAndUpdate(
        commentId,
        { $inc: { dislikes: -1 } },
        { new: true }
      );
      return res.status(200).json({
        likes: Math.max(updated?.likes || 0, 0),
        dislikes: Math.max(updated?.dislikes || 0, 0),
        userVote: null,
        removed: false,
      });
    }

    if (existing && existing.type === "like") {
      // Was liked → switch to dislike
      existing.type = "dislike";
      await existing.save();
      const updated = await comment.findByIdAndUpdate(
        commentId,
        { $inc: { dislikes: 1, likes: -1 } },
        { new: true }
      );

      // Auto-remove if dislikes reach 2
      if ((updated?.dislikes || 0) >= 2) {
        await comment.findByIdAndDelete(commentId);
        await commentvote.deleteMany({ commentId });
        return res.status(200).json({
          likes: 0,
          dislikes: 0,
          userVote: null,
          removed: true,
        });
      }

      return res.status(200).json({
        likes: Math.max(updated?.likes || 0, 0),
        dislikes: Math.max(updated?.dislikes || 0, 0),
        userVote: "dislike",
        removed: false,
      });
    }

    // No existing vote → create dislike
    await commentvote.create({ userId, commentId, type: "dislike" });
    const updated = await comment.findByIdAndUpdate(
      commentId,
      { $inc: { dislikes: 1 } },
      { new: true }
    );

    // Auto-remove if dislikes reach 2
    if ((updated?.dislikes || 0) >= 2) {
      await comment.findByIdAndDelete(commentId);
      await commentvote.deleteMany({ commentId });
      return res.status(200).json({
        likes: 0,
        dislikes: 0,
        userVote: null,
        removed: true,
      });
    }

    return res.status(200).json({
      likes: Math.max(updated?.likes || 0, 0),
      dislikes: Math.max(updated?.dislikes || 0, 0),
      userVote: "dislike",
      removed: false,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translatecomment = async (req, res) => {
  const { commentId } = req.params;
  const { targetLang } = req.body; // e.g. "hi", "es", "fr", "de"

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    const c = await comment.findById(commentId);
    if (!c) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const text = encodeURIComponent(c.commentbody);
    const url = `https://api.mymemory.translated.net/get?q=${text}&langpair=autodetect|${targetLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return res.status(200).json({
        translatedText: data.responseData.translatedText,
        detectedLang: data.responseData.match?.source || "auto",
      });
    } else {
      return res.status(400).json({
        message: "Translation failed",
        detail: data.responseData?.translatedText || "Unknown error",
      });
    }
  } catch (error) {
    console.error(" translation error:", error);
    return res.status(500).json({ message: "Translation service unavailable" });
  }
};

export const getvotestatus = async (req, res) => {
  const { commentIds, userId } = req.body;

  if (!userId || !Array.isArray(commentIds)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const votes = await commentvote.find({
      userId,
      commentId: { $in: commentIds },
    });

    // Build a map: commentId -> "like" | "dislike"
    const voteMap = {};
    votes.forEach((v) => {
      voteMap[v.commentId.toString()] = v.type;
    });

    return res.status(200).json(voteMap);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

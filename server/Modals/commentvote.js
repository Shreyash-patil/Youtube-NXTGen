import mongoose from "mongoose";

const commentvoteschema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One vote per user per comment
commentvoteschema.index({ userId: 1, commentId: 1 }, { unique: true });

export default mongoose.model("commentvote", commentvoteschema);

import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
import download from "../Modals/download.js";

const getDayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const normalizedPath = req.file.path.replace(/\\/g, "/");
      const file = new video({
        videotitle: req.body.videotitle,
        videodescription: req.body.videodescription || "",
        filename: req.file.originalname,
        filepath: normalizedPath,
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handledownloadvideo = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  try {
    const [targetVideo, targetUser] = await Promise.all([
      video.findById(videoId).lean(),
      users.findById(userId).lean(),
    ]);

    if (!targetVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { start, end } = getDayWindow();
    const todaysDownloadCount = await download.countDocuments({
      userId,
      downloadedAt: { $gte: start, $lt: end },
    });

    const freeLimit = 1;
    const isPremium = targetUser.plan && targetUser.plan !== "free";
    const canDownload = isPremium || todaysDownloadCount < freeLimit;

    if (!canDownload) {
      return res.status(403).json({
        message: "Daily free download limit reached. Upgrade to Premium.",
        requiresPremium: true,
        dailyLimit: freeLimit,
        todaysDownloadCount,
      });
    }

    await download.create({ userId, videoId: targetVideo._id.toString() });

    return res.status(200).json({
      message: "Download started",
      downloadPath: targetVideo.filepath,
      plan: targetUser.plan || "free",
      dailyLimit: freeLimit,
      todaysDownloadCount: isPremium ? todaysDownloadCount : todaysDownloadCount + 1,
      remainingDownloads: isPremium ? null : Math.max(0, freeLimit - (todaysDownloadCount + 1)),
      video: targetVideo,
    });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserdownloads = async (req, res) => {
  const { userId } = req.params;

  try {
    const list = await download
      .find({ userId })
      .sort({ downloadedAt: -1 })
      .lean();

    const videoIds = list.map((d) => d.videoId);
    const videos = await video.find({ _id: { $in: videoIds } }).lean();
    const byId = new Map(videos.map((v) => [v._id.toString(), v]));

    const response = list
      .map((d) => ({
        ...d,
        video: byId.get(d.videoId) || null,
      }))
      .filter((item) => !!item.video);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removedownload = async (req, res) => {
  const { downloadId } = req.params;

  try {
    const record = await download.findByIdAndDelete(downloadId);
    if (!record) {
      return res.status(404).json({ message: "Download not found" });
    }
    return res.status(200).json({ message: "Download removed" });
  } catch (error) {
    console.error("Remove download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getVideoById = async (req, res) => {
  const { id } = req.params;
  try {
    const found = await video.findById(id);
    if (!found) {
      return res.status(404).json({ message: "Video not found" });
    }
    return res.status(200).json(found);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

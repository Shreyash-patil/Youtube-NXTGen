import { Check, FileVideo, Upload, X } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";
import { Textarea } from "./ui/textarea";
import { useTheme } from "@/lib/ThemeContext";

const VideoUploader = ({ channelId, channelName }: any) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlefilechange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit.");
        return;
      }
      setVideoFile(file);
      const filename = file.name;
      if (!videoTitle) {
        setVideoTitle(filename);
      }
    }
  };
  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setVideoDescription("");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const cancelUpload = () => {
    if (isUploading) {
      toast.error("Your video upload has been cancelled");
    }
  };
  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide file and title");
      return;
    }
    const formdata = new FormData();
    formdata.append("file", videoFile);
    formdata.append("videotitle", videoTitle);
    formdata.append("videodescription", videoDescription);
    formdata.append("videochanel", channelName);
    formdata.append("uploader", channelId);
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const res = await axiosInstance.post("/video/upload", formdata, {
         headers: {
    "Content-Type": "multipart/form-data", // ✅ MUST for FormData
  },
        onUploadProgress: (progresEvent: any) => {
          const progress = Math.round(
            (progresEvent.loaded * 100) / progresEvent.total
          );
          setUploadProgress(progress);
        },
      });
      toast.success("Upload successfully");
      resetForm();
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("There was an error uploading your video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div
      className={`rounded-lg p-3 sm:p-4 md:p-6 ${
        isDark ? "bg-white/5" : "bg-gray-50"
      }`}
    >
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Upload a video
      </h2>

      <div className="space-y-4">
        {!videoFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
              isDark
                ? "border-white/20 hover:bg-white/5"
                : "border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <p className="text-base sm:text-lg font-medium">
              <span className="hidden sm:inline">Drag and drop video files to upload</span>
              <span className="sm:hidden">Tap to upload a video</span>
            </p>
            <p
              className={`text-sm mt-1 hidden sm:block ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              or click to select files
            </p>
            <p
              className={`text-xs mt-3 sm:mt-4 ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            >
              MP4, WebM, MOV or AVI • Up to 100MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handlefilechange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-2 rounded-md ${
                  isDark ? "bg-blue-900/40" : "bg-blue-100"
                }`}
              >
                <FileVideo className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{videoFile.name}</p>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={cancelUpload}>
                  <X className="w-5 h-5" />
                </Button>
              )}
              {uploadComplete && (
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Title (required)</Label>
                <Input
                  id="title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Add a title that describes your video"
                  disabled={isUploading || uploadComplete}
                  className={`mt-1 ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      : ""
                  }`}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  disabled={isUploading || uploadComplete}
                  className={`mt-1 ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      : ""
                  }`}
                />
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              {!uploadComplete && (
                <>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={cancelUpload}
                    disabled={uploadComplete}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleUpload}
                    disabled={
                      isUploading || !videoTitle.trim() || uploadComplete
                    }
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;

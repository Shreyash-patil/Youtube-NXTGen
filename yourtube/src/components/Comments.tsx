import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";

// Characters blocked in comments
const SPECIAL_CHAR_REGEX = /[~@#$%^&*()_+={}[\]|\\<>`]/;

// Supported languages for translation
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "ur", label: "Urdu" },
];

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  city?: string;
  likes: number;
  dislikes: number;
  commentedon: string;
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [charError, setCharError] = useState("");
  const [editCharError, setEditCharError] = useState("");
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);

  // City detection
  const [userCity, setUserCity] = useState("");

  // Vote tracking: commentId -> "like" | "dislike" | null
  const [userVotes, setUserVotes] = useState<Record<string, string | null>>({});

  // Translation state: commentId -> { text, lang, loading }
  const [translations, setTranslations] = useState<
    Record<string, { text: string; lang: string; loading: boolean }>
  >({});

  // Language picker: which comment is showing the picker
  const [langPickerOpen, setLangPickerOpen] = useState<string | null>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);

  // Detect user city on mount
  useEffect(() => {
    const detectCity = async () => {
      try {
        const res = await fetch("http://ip-api.com/json/?fields=city");
        const data = await res.json();
        if (data.city) setUserCity(data.city);
      } catch {
        // Silently fail — city is optional
      }
    };
    detectCity();
  }, []);

  // Close language picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langPickerRef.current &&
        !langPickerRef.current.contains(e.target as Node)
      ) {
        setLangPickerOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!videoId) {
      setLoading(false);
      return;
    }
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    if (!videoId) return;
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);

      // Fetch vote status for all comments if user is logged in
      if (user?._id && res.data.length > 0) {
        const commentIds = res.data.map((c: Comment) => c._id);
        const votesRes = await axiosInstance.post("/comment/votes", {
          commentIds,
          userId: user._id,
        });
        setUserVotes(votesRes.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  // Validate special characters
  const validateComment = (text: string): string => {
    if (SPECIAL_CHAR_REGEX.test(text)) {
      const matched = text.match(SPECIAL_CHAR_REGEX);
      return `Character "${matched?.[0]}" is not allowed. Please remove special characters like @#$%^&*()_+={}[]|\\<>\``;
    }
    return "";
  };

  const handleCommentChange = (val: string) => {
    setNewComment(val);
    const err = validateComment(val);
    setCharError(err);
  };

  const handleEditChange = (val: string) => {
    setEditText(val);
    const err = validateComment(val);
    setEditCharError(err);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    const err = validateComment(newComment);
    if (err) {
      setCharError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        city: userCity,
      });
      if (res.data.comment) {
        await loadComments();
      }
      setNewComment("");
      setCharError("");
    } catch (error: any) {
      if (error.response?.data?.blocked) {
        setCharError(error.response.data.message);
      } else {
        console.error("Error adding comment:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
    setEditCharError("");
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;

    const err = validateComment(editText);
    if (err) {
      setEditCharError(err);
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
        setEditCharError("");
      }
    } catch (error: any) {
      if (error.response?.data?.blocked) {
        setEditCharError(error.response.data.message);
      } else {
        console.log(error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, {
        userId: user._id,
      });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes }
            : c
        )
      );
      setUserVotes((prev) => ({ ...prev, [commentId]: res.data.userVote }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, {
        userId: user._id,
      });
      if (res.data.removed) {
        // Comment was auto-removed due to 2 dislikes
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes }
              : c
          )
        );
        setUserVotes((prev) => ({ ...prev, [commentId]: res.data.userVote }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTranslate = async (commentId: string, targetLang: string) => {
    setLangPickerOpen(null);
    setTranslations((prev) => ({
      ...prev,
      [commentId]: { text: "", lang: targetLang, loading: true },
    }));

    try {
      const res = await axiosInstance.post(`/comment/translate/${commentId}`, {
        targetLang,
      });
      setTranslations((prev) => ({
        ...prev,
        [commentId]: {
          text: res.data.translatedText,
          lang: targetLang,
          loading: false,
        },
      }));
    } catch (error) {
      setTranslations((prev) => ({
        ...prev,
        [commentId]: {
          text: "Translation failed. Please try again.",
          lang: targetLang,
          loading: false,
        },
      }));
    }
  };

  const clearTranslation = (commentId: string) => {
    setTranslations((prev) => {
      const copy = { ...prev };
      delete copy[commentId];
      return copy;
    });
  };

  const getLangLabel = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label || code;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold">
        {comments.length} Comments
      </h2>

      {user && (
        <div className="flex gap-3 sm:gap-4">
          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => handleCommentChange(e.target.value)}
              className={`min-h-[72px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0 w-full ${
                charError ? "border-b-red-500" : ""
              }`}
            />
            {charError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {charError}
              </p>
            )}
            {userCity && (
              <p className="text-xs text-gray-400">
                Posting from {userCity}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewComment("");
                  setCharError("");
                }}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting || !!charError}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 sm:gap-4">
              <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>
                  {comment.usercommented?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                  <span className="font-medium text-sm truncate max-w-[60%]">
                    {comment.usercommented}
                  </span>
                  {comment.city && (
                    <span className="text-xs text-blue-500 flex items-center gap-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {comment.city}
                    </span>
                  )}
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => handleEditChange(e.target.value)}
                      className={editCharError ? "border-red-500" : ""}
                    />
                    {editCharError && (
                      <p className="text-xs text-red-500">{editCharError}</p>
                    )}
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={handleUpdateComment}
                        disabled={!editText.trim() || !!editCharError}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                          setEditCharError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {comment.commentbody}
                    </p>

                    {/* Translation result */}
                    {translations[comment._id] && (
                      <div className={`mt-1.5 p-2 rounded-md border ${isDark ? "bg-blue-950/30 border-blue-900" : "bg-blue-50 border-blue-100"}`}>
                        {translations[comment._id].loading ? (
                          <p className="text-xs text-blue-500 animate-pulse">
                            Translating...
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-blue-400 mb-0.5">
                              Translated to{" "}
                              {getLangLabel(translations[comment._id].lang)}
                            </p>
                            <p className="text-sm text-blue-800 break-words whitespace-pre-wrap">
                              {translations[comment._id].text}
                            </p>
                            <button
                              className="text-xs text-blue-400 hover:text-blue-600 mt-1"
                              onClick={() => clearTranslation(comment._id)}
                            >
                              Hide translation
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Action buttons: Like, Dislike, Translate, Edit, Delete */}
                    <div className={`flex items-center gap-3 mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {/* Like button */}
                      <button
                        className={`flex items-center gap-1 transition-colors ${
                          userVotes[comment._id] === "like"
                            ? "text-blue-600"
                            : "hover:text-blue-600"
                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => handleLike(comment._id)}
                        disabled={!user}
                        title={user ? "Like" : "Sign in to like"}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={
                            userVotes[comment._id] === "like"
                              ? "currentColor"
                              : "none"
                          }
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                          />
                        </svg>
                        {comment.likes > 0 && (
                          <span className="text-xs">{comment.likes}</span>
                        )}
                      </button>

                      {/* Dislike button */}
                      <button
                        className={`flex items-center gap-1 transition-colors ${
                          userVotes[comment._id] === "dislike"
                            ? "text-red-500"
                            : "hover:text-red-500"
                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => handleDislike(comment._id)}
                        disabled={!user}
                        title={user ? "Dislike" : "Sign in to dislike"}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={
                            userVotes[comment._id] === "dislike"
                              ? "currentColor"
                              : "none"
                          }
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"
                          />
                        </svg>
                        {comment.dislikes > 0 && (
                          <span className="text-xs">{comment.dislikes}</span>
                        )}
                      </button>

                      {/* Translate button */}
                      <div className="relative" ref={langPickerOpen === comment._id ? langPickerRef : null}>
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          onClick={() =>
                            setLangPickerOpen(
                              langPickerOpen === comment._id
                                ? null
                                : comment._id
                            )
                          }
                          title="Translate"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                          </svg>
                          <span className="text-xs">Translate</span>
                        </button>

                        {/* Language picker dropdown */}
                        {langPickerOpen === comment._id && (
                          <div className={`absolute left-0 bottom-full mb-1 border rounded-lg shadow-lg z-20 w-40 max-h-48 overflow-y-auto ${isDark ? "bg-[#1a1a2e] border-white/10" : "bg-white border-gray-200"}`}>
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${isDark ? "hover:bg-white/10 hover:text-blue-400" : "hover:bg-blue-50 hover:text-blue-600"}`}
                                onClick={() =>
                                  handleTranslate(comment._id, lang.code)
                                }
                              >
                                {lang.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Edit / Delete for own comments */}
                      {comment.userid === user?._id && (
                        <>
                          <button
                            className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-black"}`}
                            onClick={() => handleEdit(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className="hover:text-red-600 transition-colors"
                            onClick={() => handleDelete(comment._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;

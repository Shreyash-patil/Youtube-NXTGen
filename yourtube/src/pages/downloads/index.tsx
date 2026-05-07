import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DownloadsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDownloads = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get(`/video/downloads/${user._id}`);
        setItems(res.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load downloads");
      } finally {
        setLoading(false);
      }
    };
    loadDownloads();
  }, [user?._id]);

  const handleDownload = (item: any) => {
    const src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${item.video.filepath}`;
    const a = document.createElement("a");
    a.href = src;
    a.download = item.video.filename || `${item.video.videotitle || "video"}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemove = async (downloadId: string) => {
    try {
      await axiosInstance.delete(`/video/download/${downloadId}`);
      setItems((prev) => prev.filter((item) => item._id !== downloadId));
      toast.success("Removed from downloads");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove download");
    }
  };

  if (!user) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center py-14">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">Downloads</h1>
          <p className="text-gray-600">Sign in to view your downloaded videos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Downloads</h1>
          <p className="text-sm text-gray-600">
            {user?.plan && user.plan !== "free"
              ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} plan active`
              : "Free plan: 1 download per day"}
          </p>
        </div>

        {loading ? (
          <p>Loading downloads...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border p-4 sm:p-6 text-center">
            <p className="text-gray-600">No downloads yet.</p>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Explore videos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Link href={`/watch/${item.video._id}`} className="block w-full sm:w-44">
                  <div className="aspect-video rounded bg-gray-100 overflow-hidden">
                    <video
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${item.video.filepath}`}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/watch/${item.video._id}`}>
                    <h2 className="font-medium line-clamp-2 break-words hover:text-blue-600">
                      {item.video.videotitle}
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-600 line-clamp-1">{item.video.videochanel}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Downloaded{" "}
                    {item.downloadedAt
                      ? `${formatDistanceToNow(new Date(item.downloadedAt))} ago`
                      : "recently"}
                  </p>
                </div>
                <div className="flex gap-2 sm:self-start">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(item)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download again
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemove(item._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

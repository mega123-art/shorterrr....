import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Line } from "react-chartjs-2";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Download, Copy, BarChart2, Trash2, Link } from "lucide-react";
import config from "../config/config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [downloadingQR, setDownloadingQR] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    originalUrl: "",
    customAlias: "",
    title: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUrls();
  }, [user, navigate]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${config.apiUrl}/api/urls/user/${user._id}`
      );
      const transformedUrls = response.data.map((url) => ({
        ...url,
        fullShortUrl: `${config.baseUrl}/${url.shortUrl}`,
      }));
      setUrls(transformedUrls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load your URLs";
      setError(errorMessage);
      toast.error(errorMessage);

      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      new URL(formData.originalUrl);
    } catch (error) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title for your URL");
      return;
    }

    try {
      setFormLoading(true);
      const response = await axios.post(`${config.apiUrl}/api/urls/shorten`, {
        originalUrl: formData.originalUrl,
        customAlias: formData.customAlias || undefined,
        title: formData.title,
        userId: user._id,
      });

      toast.success("URL shortened successfully!");
      setFormData({ originalUrl: "", customAlias: "", title: "" });
      fetchUrls();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error shortening URL";
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (urlId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this URL? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingUrl(urlId);
      await axios.delete(`${config.apiUrl}/api/urls/${urlId}`);
      toast.success("URL deleted successfully");
      fetchUrls();
      if (selectedUrl === urlId) {
        setSelectedUrl(null);
        setAnalytics(null);
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      toast.error(error.response?.data?.message || "Failed to delete URL");
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchAnalytics = async (urlId) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/urls/${urlId}/analytics`
      );
      setAnalytics(response.data);
      setSelectedUrl(urlId);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error(error.response?.data?.message || "Failed to load analytics");

      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  const downloadQRCode = async (url) => {
    try {
      setDownloadingQR(url._id);
      const svg = document.getElementById(`qr-${url._id}`);
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width + 40;
          canvas.height = img.height + 40;

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);

          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `${url.title}-qr-code.png`;
          downloadLink.href = pngFile;
          downloadLink.click();

          resolve();
        };

        img.onerror = reject;
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Failed to download QR code");
    } finally {
      setDownloadingQR(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchUrls}
            className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: analytics?.dailyClicks?.map((d) => d.date) || [],
    datasets: [
      {
        label: "Clicks",
        data: analytics?.dailyClicks?.map((d) => d.clicks) || [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">
        Your URLs Dashboard
      </h1>

      {/* URL Creation Form */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Create New Short URL</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Original URL *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="originalUrl"
                  value={formData.originalUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none text-sm min-h-[44px]"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Alias (Optional)
              </label>
              <input
                type="text"
                name="customAlias"
                value={formData.customAlias}
                onChange={handleInputChange}
                className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none text-sm min-h-[44px]"
                placeholder="my-custom-url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none text-sm min-h-[44px]"
                placeholder="My Website"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm min-h-[44px]"
          >
            {formLoading ? "Creating..." : "Create Short URL"}
          </button>
        </form>
      </div>

      {/* URLs List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Short URLs</h2>
        {urls.length === 0 ? (
          <div className="p-4 bg-gray-900 rounded-lg text-center">
            <p className="text-gray-400 text-sm">
              You haven't created any URLs yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {urls.map((url) => (
              <div
                key={url._id}
                className="p-4 bg-gray-900 rounded-lg shadow-lg hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="space-y-3">
                  <h3 className="font-medium text-base break-words">
                    {url.title}
                  </h3>
                  <p className="text-gray-400 text-xs break-words">
                    {url.originalUrl}
                  </p>

                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={url.fullShortUrl}
                        readOnly
                        className="w-full px-3 py-2.5 pr-10 rounded-lg bg-gray-800 text-xs break-all min-h-[40px]"
                      />
                      <button
                        onClick={() => copyToClipboard(url.fullShortUrl)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-700 rounded transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => fetchAnalytics(url._id)}
                        className="py-2.5 px-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-xs min-h-[40px]"
                      >
                        <BarChart2 className="h-4 w-4" />
                        <span>Analytics</span>
                      </button>

                      <button
                        onClick={() => handleDelete(url._id)}
                        disabled={deletingUrl === url._id}
                        className="py-2.5 px-3 bg-red-600/90 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-xs min-h-[40px]"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>
                          {deletingUrl === url._id ? "Deleting..." : "Delete"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="bg-white p-3 rounded-lg shadow-md">
                      <QRCodeSVG
                        id={`qr-${url._id}`}
                        value={url.fullShortUrl}
                        size={80}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <button
                      onClick={() => downloadQRCode(url)}
                      disabled={downloadingQR === url._id}
                      className="w-full px-4 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-xs min-h-[40px]"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {downloadingQR === url._id
                          ? "Downloading..."
                          : "Download QR Code"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {selectedUrl && analytics && (
        <div id="analytics-section" className="mt-6">
          <div className="p-4 bg-gray-900 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Analytics</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-800 rounded-lg shadow-md">
                <p className="text-xs text-gray-400">Total Clicks</p>
                <p className="text-lg font-bold">{analytics.totalClicks}</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg shadow-md">
                <p className="text-xs text-gray-400">Unique Visitors</p>
                <p className="text-lg font-bold">{analytics.uniqueVisitors}</p>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg shadow-md">
              <h3 className="text-base font-semibold mb-4">Click History</h3>
              <div className="w-full h-[200px]">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: {
                            size: 10,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 10,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

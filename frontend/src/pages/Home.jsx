import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import config from "../config/config";
import { QrCode, BarChart2, Link } from "lucide-react";

function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      new URL(url);
    } catch (error) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      const response = await axios.post(`${config.apiUrl}/api/urls/shorten`, {
        originalUrl: url,
        customAlias: alias || undefined,
        title: url,
        userId: user?._id,
      });

      const shortenedUrl = response.data.shortUrl;
      setShortUrl(shortenedUrl);
      toast.success("URL shortened successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error shortening URL";
      toast.error(errorMessage);
      console.error("Error:", error);
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

  const features = [
    {
      icon: <QrCode className="w-12 h-12" />,
      title: "QR Code Generation",
      description:
        "Generate QR codes for your shortened URLs instantly. Perfect for print materials and contactless sharing.",
    },
    {
      icon: <BarChart2 className="w-12 h-12" />,
      title: "Advanced Analytics",
      description:
        "Track clicks, analyze visitor demographics, and monitor traffic patterns with detailed analytics.",
    },
    {
      icon: <Link className="w-12 h-12" />,
      title: "Custom Aliases",
      description:
        "Create memorable, branded short links with custom aliases that reflect your brand or content.",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto pt-24 px-6">
        <div className="text-center mb-20">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent animate-pulse">
            Shorterrr...
          </h1>
          <p className="text-2xl md:text-3xl text-gray-400">
            Make your links shorter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your long URL (e.g., https://example.com)"
              className="form-input text-lg md:text-xl"
              required
            />
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Custom alias (optional)"
              className="form-input md:w-1/3 text-lg md:text-xl"
            />
          </div>
          <button
            type="submit"
            className="form-button text-lg md:text-xl py-4 md:py-5"
          >
            Shorten URL
          </button>
        </form>

        {shortUrl && (
          <div className="mt-12 p-8 bg-gray-900 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6">Your Shortened URL:</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="text"
                value={shortUrl}
                readOnly
                className="form-input text-lg md:text-xl"
              />
              <button
                onClick={() => copyToClipboard(shortUrl)}
                className="form-button md:w-auto md:px-8 text-lg md:text-xl"
              >
                Copy
              </button>
            </div>
            <p className="mt-6 text-lg text-gray-400">
              This short URL will redirect to: {url}
            </p>
          </div>
        )}

        {/* Feature Cards */}
        <div className="mt-24 mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Features for Your Links
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gray-900 rounded-2xl hover:bg-gray-800 transition-colors duration-300"
              >
                <div className="mb-6 text-white">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <div className="mt-12 p-6 bg-gray-900 rounded-lg text-center">
            <p className="text-xl text-gray-400">
              Sign up for free to access advanced features like custom aliases,
              QR codes, and analytics!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

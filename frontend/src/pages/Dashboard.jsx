import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import config from '../config/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

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

  // Form state
  const [formData, setFormData] = useState({
    originalUrl: '',
    customAlias: '',
    title: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, [user, navigate]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.apiUrl}/api/urls/user/${user._id}`);
      // Transform the URLs to include the full shortened URL
      const transformedUrls = response.data.map(url => ({
        ...url,
        fullShortUrl: `${config.baseUrl}/${url.shortUrl}`
      }));
      setUrls(transformedUrls);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load your URLs';
      setError(errorMessage);
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/login');
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
      toast.error('Please enter a valid URL');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for your URL');
      return;
    }

    try {
      setFormLoading(true);
      const response = await axios.post(`${config.apiUrl}/api/urls/shorten`, {
        originalUrl: formData.originalUrl,
        customAlias: formData.customAlias || undefined,
        title: formData.title,
        userId: user._id
      });

      toast.success('URL shortened successfully!');
      setFormData({ originalUrl: '', customAlias: '', title: '' });
      fetchUrls();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error shortening URL';
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (urlId) => {
    if (!window.confirm('Are you sure you want to delete this URL? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingUrl(urlId);
      await axios.delete(`${config.apiUrl}/api/urls/${urlId}`);
      toast.success('URL deleted successfully');
      fetchUrls();
      if (selectedUrl === urlId) {
        setSelectedUrl(null);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      toast.error(error.response?.data?.message || 'Failed to delete URL');
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fetchAnalytics = async (urlId) => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/urls/${urlId}/analytics`);
      setAnalytics(response.data);
      setSelectedUrl(urlId);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error.response?.data?.message || 'Failed to load analytics');
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL');
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
    labels: analytics?.dailyClicks?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Clicks',
        data: analytics?.dailyClicks?.map(d => d.clicks) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your URLs Dashboard</h1>
      
      {/* URL Creation Form */}
      <div className="mb-8 p-6 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create New Short URL</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Original URL *</label>
              <input
                type="url"
                name="originalUrl"
                value={formData.originalUrl}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Custom Alias (Optional)</label>
              <input
                type="text"
                name="customAlias"
                value={formData.customAlias}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none"
                placeholder="my-custom-url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none"
                placeholder="My Website"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading ? 'Creating...' : 'Create Short URL'}
          </button>
        </form>
      </div>

      {/* URLs and Analytics */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Short URLs</h2>
          {urls.length === 0 ? (
            <div className="p-4 bg-gray-900 rounded-lg text-center">
              <p className="text-gray-400">You haven't created any URLs yet.</p>
            </div>
          ) : (
            urls.map(url => (
              <div
                key={url._id}
                className="p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <h3 className="font-medium text-lg">{url.title}</h3>
                <p className="text-gray-400 text-sm truncate mt-1">{url.originalUrl}</p>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={url.fullShortUrl}
                    readOnly
                    className="flex-1 px-3 py-1 rounded bg-gray-800 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(url.fullShortUrl)}
                    className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => fetchAnalytics(url._id)}
                    className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => handleDelete(url._id)}
                    disabled={deletingUrl === url._id}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingUrl === url._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                <div className="mt-4">
                  <a 
                    href={url.fullShortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block hover:opacity-80 transition-opacity"
                  >
                    <QRCodeSVG value={url.fullShortUrl} size={100} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          {selectedUrl && analytics && (
            <div className="p-6 bg-gray-900 rounded-lg sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Analytics</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Total Clicks</p>
                  <p className="text-2xl font-bold">{analytics.totalClicks}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Unique Visitors</p>
                  <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Click History</h3>
                <Line data={chartData} options={ {
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                } } />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
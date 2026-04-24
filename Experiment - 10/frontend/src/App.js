import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, Users, MapPin, Bell, Activity, TrendingUp, Send, LogOut, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';

const DisasterReliefSystem = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [mlPredictions, setMlPredictions] = useState({
    forecastedDemand: { Food: 800, Medical: 350, Shelter: 150, Water: 1200 },
    matchingAccuracy: 87,
    responseTime: '2.3 hours'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auth form states
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'victim',
    phone: '',
    address: ''
  });

  // Request form state
  const [newRequest, setNewRequest] = useState({
    type: '',
    quantity: '',
    location: '',
    description: '',
    urgency: 'medium'
  });

  // API Base URLs (in production, use environment variables)
  const API_URL = 'http://localhost:5000/api';
  const ML_API_URL = 'http://localhost:5001/api/ml';

  // Get auth token
  const getToken = () => localStorage.getItem('token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // ML API call helper
  const mlApiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${ML_API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) throw new Error('ML API request failed');
      return await response.json();
    } catch (error) {
      console.error('ML API Error:', error);
      return null;
    }
  };

  // Auth functions
  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      addNotification('Login successful', 'success');
      await fetchAllData();
    } catch (error) {
      addNotification(error.message || 'Login failed', 'alert');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: authForm.role,
          phone: authForm.phone,
          location: {
            address: authForm.address,
            lat: 31.3260 + (Math.random() - 0.5) * 0.1,
            lng: 75.5762 + (Math.random() - 0.5) * 0.1
          }
        })
      });

      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      addNotification('Registration successful', 'success');
      await fetchAllData();
    } catch (error) {
      addNotification(error.message || 'Registration failed', 'alert');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setResources([]);
    setRequests([]);
    setVolunteers([]);
    setNotifications([]);
    addNotification('Logged out successfully', 'info');
  };

  // Data fetching functions
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchResources(),
        fetchRequests(),
        fetchVolunteers(),
        fetchNotifications(),
        fetchMLPredictions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await apiCall('/resources');
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await apiCall('/requests');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const data = await apiCall('/volunteers');
      setVolunteers(data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiCall('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      const data = await mlApiCall('/forecast-all');
      if (data) {
        const forecasts = {};
        data.forEach(item => {
          forecasts[item.resource_type] = item.predicted_demand;
        });
        setMlPredictions(prev => ({
          ...prev,
          forecastedDemand: forecasts
        }));
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString(),
      type
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
  };

  // Submit request
  const handleRequestSubmit = async () => {
    if (!newRequest.type || !newRequest.quantity || !newRequest.location) {
      addNotification('Please fill all required fields', 'alert');
      return;
    }

    setLoading(true);
    try {
      // First, classify the request using ML
      const classification = await mlApiCall('/classify-request', {
        method: 'POST',
        body: JSON.stringify({ text: newRequest.description || newRequest.type })
      });

      const requestData = {
        type: newRequest.type,
        quantity: parseInt(newRequest.quantity),
        urgency: newRequest.urgency,
        location: {
          name: newRequest.location,
          lat: 31.3260 + (Math.random() - 0.5) * 0.1,
          lng: 75.5762 + (Math.random() - 0.5) * 0.1
        },
        description: newRequest.description
      };

      const data = await apiCall('/requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      setRequests(prev => [data, ...prev]);
      setNewRequest({ type: '', quantity: '', location: '', description: '', urgency: 'medium' });
      addNotification(`Request submitted successfully`, 'success');
    } catch (error) {
      addNotification(error.message || 'Failed to submit request', 'alert');
    }
    setLoading(false);
  };

  // Allocate resource
  const allocateResource = async (requestId) => {
    setLoading(true);
    try {
      // Find matching resource
      const request = requests.find(r => r._id === requestId);
      const matchingResource = resources.find(r => 
        r.type === request.type && 
        r.status === 'available' && 
        r.quantity >= request.quantity
      );

      if (!matchingResource) {
        addNotification('No matching resource available', 'alert');
        setLoading(false);
        return;
      }

      await apiCall(`/requests/${requestId}/allocate`, {
        method: 'POST',
        body: JSON.stringify({
          resourceId: matchingResource._id
        })
      });

      await fetchRequests();
      await fetchResources();
      addNotification(`Resource allocated successfully`, 'success');
    } catch (error) {
      addNotification(error.message || 'Failed to allocate resource', 'alert');
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      // Verify token and fetch user data
      apiCall('/auth/verify')
        .then(data => {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          fetchAllData();
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  // Login/Register View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Disaster Relief System</h1>
            <p className="text-blue-100">AI-Powered Emergency Response</p>
          </div>

          <div className="p-8">
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-3 font-medium transition-colors ${
                  showLogin 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600'
                }`}
              >
                <LogIn className="w-5 h-5 inline mr-2" />
                Login
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-3 font-medium transition-colors ${
                  !showLogin 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600'
                }`}
              >
                <UserPlus className="w-5 h-5 inline mr-2" />
                Register
              </button>
            </div>

            <div className="space-y-4">
              {!showLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <select
                      value={authForm.role}
                      onChange={(e) => setAuthForm({...authForm, role: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="victim">Victim</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!showLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91-9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      value={authForm.address}
                      onChange={(e) => setAuthForm({...authForm, address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>
                </>
              )}

              <button
                onClick={showLogin ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (showLogin ? 'Login' : 'Register')}
              </button>

              {showLogin && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</p>
                  <p className="text-xs text-gray-600">Admin: admin@disaster.com / password123</p>
                  <p className="text-xs text-gray-600">Victim: victim@test.com / password123</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Requests</p>
              <h3 className="text-3xl font-bold mt-2">{requests.length}</h3>
            </div>
            <AlertCircle className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Resources</p>
              <h3 className="text-3xl font-bold mt-2">{resources.filter(r => r.status === 'available').length}</h3>
            </div>
            <Package className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Volunteers</p>
              <h3 className="text-3xl font-bold mt-2">{volunteers.filter(v => v.isAvailable).length}</h3>
            </div>
            <Users className="w-12 h-12 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">ML Accuracy</p>
              <h3 className="text-3xl font-bold mt-2">{mlPredictions.matchingAccuracy}%</h3>
            </div>
            <Activity className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
            ML Demand Forecast
          </h3>
          <div className="space-y-4">
            {Object.entries(mlPredictions.forecastedDemand).map(([type, value]) => (
              <div key={type}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{type}</span>
                  <span className="text-gray-600">{value} units</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${(value / Math.max(...Object.values(mlPredictions.forecastedDemand))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-orange-600" />
            Recent Notifications
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                    notif.type === 'alert' ? 'text-red-600' :
                    notif.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const MapView = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <MapPin className="w-6 h-6 mr-2 text-red-600" />
        Interactive Resource Map
      </h3>
      <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg h-96 overflow-hidden">
        <div className="absolute inset-0 p-8">
          {requests.map((req, idx) => (
            <div
              key={req._id || idx}
              className="absolute"
              style={{
                left: `${20 + (idx % 5) * 18}%`,
                top: `${20 + Math.floor(idx / 5) * 25}%`
              }}
            >
              <div className={`relative ${req.urgency === 'critical' ? 'animate-pulse' : ''}`}>
                <div className={`w-4 h-4 rounded-full ${
                  req.urgency === 'critical' ? 'bg-red-600' :
                  req.urgency === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="absolute left-6 top-0 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                  {req.location?.name || 'Unknown'} - {req.type}
                </div>
              </div>
            </div>
          ))}
          {resources.slice(0, 5).map((res, idx) => (
            <div
              key={res._id || idx}
              className="absolute"
              style={{
                left: `${25 + (idx % 4) * 20}%`,
                top: `${30 + Math.floor(idx / 4) * 30}%`
              }}
            >
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-green-600" />
                <div className="absolute left-6 top-0 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                  {res.location?.name || 'Unknown'} - {res.type}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-red-600 mr-2" />
            <span>Critical Request</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-600 mr-2" />
            <span>Available Resource</span>
          </div>
        </div>
      </div>
    </div>
  );

  const RequestsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Submit New Request</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Resource Type *</label>
              <select
                value={newRequest.type}
                onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="Food">Food</option>
                <option value="Medical">Medical Supplies</option>
                <option value="Shelter">Shelter</option>
                <option value="Water">Water</option>
                <option value="Clothing">Clothing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input
                type="number"
                value={newRequest.quantity}
                onChange={(e) => setNewRequest({...newRequest, quantity: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={newRequest.location}
              onChange={(e) => setNewRequest({...newRequest, location: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Urgency</label>
            <select
              value={newRequest.urgency}
              onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newRequest.description}
              onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Additional details..."
            />
          </div>
          <button
            onClick={handleRequestSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Active Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Quantity</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Urgency</th>
                <th className="text-left p-3">Status</th>
                {(currentUser?.role === 'admin' || currentUser?.role === 'ngo') && (
                  <th className="text-left p-3">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No requests available
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">{req.type}</td>
                    <td className="p-3">{req.quantity}</td>
                    <td className="p-3">{req.location?.name || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        req.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        req.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'allocated' ? 'bg-green-100 text-green-800' :
                        req.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'ngo') && (
                      <td className="p-3">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => allocateResource(req._id)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                          >
                            Allocate
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const VolunteersView = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Users className="w-6 h-6 mr-2 text-purple-600" />
        Volunteer Management
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volunteers.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-8">No volunteers available</p>
        ) : (
          volunteers.map(vol => (
            <div key={vol._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg">{vol.name}</h4>
                <div className={`w-3 h-3 rounded-full ${vol.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {vol.location?.address || 'Location not set'}
              </p>
              {vol.skills && vol.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {vol.skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mb-3">{vol.email}</p>
              {(currentUser?.role === 'admin' || currentUser?.role === 'ngo') && (
                <button className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                  Assign Task
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Disaster Relief Resource Allocation System</h1>
            <p className="text-blue-100">AI-Powered Emergency Response Platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{currentUser?.name}</p>
              <p className="text-xs text-blue-100">{currentUser?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'map' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'requests' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'volunteers' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Volunteers
            </button>
          </div>
        </div>

        <div className="mb-6">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'requests' && <RequestsView />}
          {activeTab === 'volunteers' && <VolunteersView />}
        </div>
      </div>
    </div>
  );
};

export default DisasterReliefSystem;
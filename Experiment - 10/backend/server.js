// server.js - Main Backend Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'ngo', 'volunteer', 'victim'], default: 'victim' },
  phone: String,
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  skills: [String],
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Resource Schema
const resourceSchema = new mongoose.Schema({
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  location: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ['available', 'allocated', 'depleted'], default: 'available' },
  providedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiryDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// Request Schema
const requestSchema = new mongoose.Schema({
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  urgency: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  location: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  description: String,
  status: { type: String, enum: ['pending', 'allocated', 'fulfilled', 'cancelled'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allocatedResource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['alert', 'info', 'success', 'warning'], default: 'info' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ML Prediction Schema (for storing ML model predictions)
const predictionSchema = new mongoose.Schema({
  resourceType: { type: String, required: true },
  predictedDemand: { type: Number, required: true },
  confidence: { type: Number, default: 0 },
  timeframe: { type: String, default: '24h' },
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Resource = mongoose.model('Resource', resourceSchema);
const Request = mongoose.model('Request', requestSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

// ==================== MIDDLEWARE ====================

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Role-based Authorization Middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, skills } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'victim',
      phone,
      location,
      skills
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESOURCE ROUTES ====================

// Get all resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const resources = await Resource.find(filter).populate('providedBy', 'name email');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create resource
app.post('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resource = new Resource({
      ...req.body,
      providedBy: req.user.id
    });
    await resource.save();

    // Create notification
    await Notification.create({
      message: `New ${resource.type} resource added at ${resource.location.name}`,
      type: 'success'
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update resource
app.put('/api/resources/:id', authenticateToken, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resource
app.delete('/api/resources/:id', authenticateToken, authorizeRoles('admin', 'ngo'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REQUEST ROUTES ====================

// Get all requests
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { status, urgency } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    const requests = await Request.find(filter)
      .populate('requestedBy', 'name email phone')
      .populate('allocatedResource')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create request
app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const request = new Request({
      ...req.body,
      requestedBy: req.user.id
    });
    await request.save();

    // Create notification for admins
    await Notification.create({
      message: `New ${request.urgency} priority request for ${request.type} at ${request.location.name}`,
      type: 'alert'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate resource to request
app.post('/api/requests/:id/allocate', authenticateToken, authorizeRoles('admin', 'ngo'), async (req, res) => {
  try {
    const { resourceId, volunteerId } = req.body;

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'allocated';
    request.allocatedResource = resourceId;
    request.assignedVolunteer = volunteerId;
    request.updatedAt = new Date();

    await request.save();

    // Update resource status
    if (resourceId) {
      await Resource.findByIdAndUpdate(resourceId, { status: 'allocated' });
    }

    // Create notification
    await Notification.create({
      message: `Resource allocated for request at ${request.location.name}`,
      type: 'success',
      recipient: request.requestedBy
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update request status
app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VOLUNTEER ROUTES ====================

// Get all volunteers
app.get('/api/volunteers', authenticateToken, async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update volunteer availability
app.put('/api/volunteers/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const volunteer = await User.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    ).select('-password');

    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATION ROUTES ====================

// Get notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user.id },
        { recipient: null } // Global notifications
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS & DASHBOARD ROUTES ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      totalResources,
      availableResources,
      totalVolunteers,
      activeVolunteers
    ] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Resource.countDocuments(),
      Resource.countDocuments({ status: 'available' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'volunteer', isAvailable: true })
    ]);

    const criticalRequests = await Request.countDocuments({ 
      urgency: 'critical', 
      status: 'pending' 
    });

    res.json({
      totalRequests,
      pendingRequests,
      criticalRequests,
      totalResources,
      availableResources,
      totalVolunteers,
      activeVolunteers,
      allocatedResources: totalResources - availableResources
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource distribution by type
app.get('/api/dashboard/resource-distribution', authenticateToken, async (req, res) => {
  try {
    const distribution = await Resource.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ML PREDICTION ROUTES ====================

// Get ML predictions (simulated - you'll integrate real ML models)
app.get('/api/ml/predictions', authenticateToken, async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // If no predictions, generate sample predictions
    if (predictions.length === 0) {
      const samplePredictions = [
        { resourceType: 'Food', predictedDemand: 800, confidence: 0.87, timeframe: '24h' },
        { resourceType: 'Medical', predictedDemand: 350, confidence: 0.82, timeframe: '24h' },
        { resourceType: 'Shelter', predictedDemand: 150, confidence: 0.78, timeframe: '24h' },
        { resourceType: 'Water', predictedDemand: 1200, confidence: 0.91, timeframe: '24h' }
      ];

      await Prediction.insertMany(samplePredictions);
      return res.json(samplePredictions);
    }

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ML-based resource matching
app.post('/api/ml/match-resources', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Find available resources of the same type
    const availableResources = await Resource.find({
      type: request.type,
      status: 'available',
      quantity: { $gte: request.quantity }
    });

    // Simple distance-based matching (you can implement more complex ML algorithms)
    const matchedResources = availableResources.map(resource => {
      const distance = calculateDistance(
        request.location.lat,
        request.location.lng,
        resource.location.lat,
        resource.location.lng
      );

      return {
        resource,
        distance,
        matchScore: 100 - (distance * 10) // Simple scoring
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json(matchedResources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILITY FUNCTIONS ====================

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
});
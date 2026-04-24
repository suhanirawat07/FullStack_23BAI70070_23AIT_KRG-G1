// seed.js - Populate database with sample data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  skills: [String],
  isAvailable: Boolean,
  createdAt: Date
});

const resourceSchema = new mongoose.Schema({
  type: String,
  quantity: Number,
  unit: String,
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  status: String,
  providedBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const requestSchema = new mongoose.Schema({
  type: String,
  quantity: Number,
  urgency: String,
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  description: String,
  status: String,
  requestedBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const notificationSchema = new mongoose.Schema({
  message: String,
  type: String,
  recipient: mongoose.Schema.Types.ObjectId,
  isRead: Boolean,
  createdAt: Date
});

// Create Models
const User = mongoose.model('User', userSchema);
const Resource = mongoose.model('Resource', resourceSchema);
const Request = mongoose.model('Request', requestSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Seed data function
const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Request.deleteMany({});
    await Notification.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users with hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@disaster.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91-9876543210',
        location: {
          address: 'Jalandhar, Punjab',
          lat: 31.3260,
          lng: 75.5762
        },
        createdAt: new Date()
      },
      {
        name: 'Red Cross NGO',
        email: 'redcross@ngo.com',
        password: hashedPassword,
        role: 'ngo',
        phone: '+91-9876543211',
        location: {
          address: 'Ludhiana, Punjab',
          lat: 30.9010,
          lng: 75.8573
        },
        createdAt: new Date()
      },
      {
        name: 'Raj Kumar',
        email: 'raj@volunteer.com',
        password: hashedPassword,
        role: 'volunteer',
        phone: '+91-9876543212',
        location: {
          address: 'Amritsar, Punjab',
          lat: 31.6340,
          lng: 74.8723
        },
        skills: ['Medical', 'Transport', 'First Aid'],
        isAvailable: true,
        createdAt: new Date()
      },
      {
        name: 'Priya Singh',
        email: 'priya@volunteer.com',
        password: hashedPassword,
        role: 'volunteer',
        phone: '+91-9876543213',
        location: {
          address: 'Jalandhar, Punjab',
          lat: 31.3260,
          lng: 75.5762
        },
        skills: ['Food Distribution', 'Shelter Management'],
        isAvailable: true,
        createdAt: new Date()
      },
      {
        name: 'Amit Patel',
        email: 'amit@volunteer.com',
        password: hashedPassword,
        role: 'volunteer',
        phone: '+91-9876543214',
        location: {
          address: 'Chandigarh',
          lat: 30.7333,
          lng: 76.7794
        },
        skills: ['Rescue Operations', 'Medical'],
        isAvailable: false,
        createdAt: new Date()
      },
      {
        name: 'Victim User',
        email: 'victim@test.com',
        password: hashedPassword,
        role: 'victim',
        phone: '+91-9876543215',
        location: {
          address: 'Patiala, Punjab',
          lat: 30.3398,
          lng: 76.3869
        },
        createdAt: new Date()
      }
    ]);

    console.log('✅ Created users:', users.length);

    // Create resources
    const resources = await Resource.insertMany([
      {
        type: 'Food',
        quantity: 500,
        unit: 'packets',
        location: {
          name: 'Central Warehouse A',
          lat: 31.3260,
          lng: 75.5762
        },
        status: 'available',
        providedBy: users[1]._id,
        createdAt: new Date()
      },
      {
        type: 'Medical',
        quantity: 200,
        unit: 'kits',
        location: {
          name: 'Government Hospital',
          lat: 30.9010,
          lng: 75.8573
        },
        status: 'available',
        providedBy: users[1]._id,
        createdAt: new Date()
      },
      {
        type: 'Shelter',
        quantity: 100,
        unit: 'tents',
        location: {
          name: 'Community Center',
          lat: 31.6340,
          lng: 74.8723
        },
        status: 'available',
        providedBy: users[1]._id,
        createdAt: new Date()
      },
      {
        type: 'Water',
        quantity: 1000,
        unit: 'liters',
        location: {
          name: 'Water Treatment Plant',
          lat: 30.7333,
          lng: 76.7794
        },
        status: 'available',
        providedBy: users[1]._id,
        createdAt: new Date()
      },
      {
        type: 'Clothing',
        quantity: 300,
        unit: 'sets',
        location: {
          name: 'Relief Center',
          lat: 30.3398,
          lng: 76.3869
        },
        status: 'available',
        providedBy: users[1]._id,
        createdAt: new Date()
      }
    ]);

    console.log('✅ Created resources:', resources.length);

    // Create requests
    const requests = await Request.insertMany([
      {
        type: 'Food',
        quantity: 150,
        urgency: 'high',
        location: {
          name: 'Sector 15, Jalandhar',
          lat: 31.3200,
          lng: 75.5700
        },
        description: 'Urgent need for food packets for 50 families affected by floods',
        status: 'pending',
        requestedBy: users[5]._id,
        createdAt: new Date()
      },
      {
        type: 'Medical',
        quantity: 50,
        urgency: 'critical',
        location: {
          name: 'Village Khanna',
          lat: 30.7050,
          lng: 76.2200
        },
        description: 'Medical emergency - need first aid kits and basic medicines',
        status: 'pending',
        requestedBy: users[5]._id,
        createdAt: new Date()
      },
      {
        type: 'Shelter',
        quantity: 30,
        urgency: 'medium',
        location: {
          name: 'Sector 22, Chandigarh',
          lat: 30.7400,
          lng: 76.7800
        },
        description: 'Temporary shelter needed for displaced families',
        status: 'allocated',
        requestedBy: users[5]._id,
        createdAt: new Date()
      },
      {
        type: 'Water',
        quantity: 500,
        urgency: 'critical',
        location: {
          name: 'Rural Area, Moga',
          lat: 30.8156,
          lng: 75.1706
        },
        description: 'Clean drinking water urgently needed for 100+ people',
        status: 'pending',
        requestedBy: users[5]._id,
        createdAt: new Date()
      },
      {
        type: 'Clothing',
        quantity: 80,
        urgency: 'low',
        location: {
          name: 'Relief Camp, Bathinda',
          lat: 30.2110,
          lng: 74.9455
        },
        description: 'Winter clothing needed for affected families',
        status: 'pending',
        requestedBy: users[5]._id,
        createdAt: new Date()
      }
    ]);

    console.log('✅ Created requests:', requests.length);

    // Create some notifications
    const notifications = await Notification.insertMany([
      {
        message: 'New critical request for medical supplies in Village Khanna',
        type: 'alert',
        recipient: users[0]._id,
        isRead: false,
        createdAt: new Date()
      },
      {
        message: 'Resource allocation successful for Sector 22',
        type: 'success',
        recipient: users[5]._id,
        isRead: false,
        createdAt: new Date()
      },
      {
        message: 'New volunteer Raj Kumar registered',
        type: 'info',
        recipient: users[0]._id,
        isRead: true,
        createdAt: new Date()
      }
    ]);

    console.log('✅ Created notifications:', notifications.length);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:     admin@disaster.com / password123');
    console.log('🏢 NGO:       redcross@ngo.com / password123');
    console.log('🙋 Volunteer: raj@volunteer.com / password123');
    console.log('😢 Victim:    victim@test.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedData();
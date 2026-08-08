/**
 * Development seed script — `npm run seed` (server workspace).
 * Creates a realistic demo dataset: admin + hostel + rooms, students,
 * a mess owner + mess + weekly menu.
 *
 * Usage: MONGODB_URI=mongodb://localhost:27017/hostel-saas npm run seed
 * Idempotent-ish: wipes seeded collections first (dev only — never run in prod).
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { config } from '../config/index.js';
import { Admin, Student, MessOwner } from '../models/User.js';
import { Hostel, Room } from '../models/Hostel.js';
import { Mess, Menu } from '../models/Mess.js';
import { Notification } from '../models/Feedback.js';

const DEMO_PASSWORD = 'DemoPass123!';

const reset = async (): Promise<void> => {
  await Promise.all([
    Student.deleteMany({}),
    Admin.deleteMany({}),
    MessOwner.deleteMany({}),
    Hostel.deleteMany({}),
    Room.deleteMany({}),
    Mess.deleteMany({}),
    Menu.deleteMany({}),
    Notification.deleteMany({}),
  ]);
};

/**
 * Connects with retries — in-memory MongoDB (dev) can take a few seconds to
 * accept connections on first boot, and CI runners are slow to cold-start.
 */
const connectWithRetry = async (attempts = 5, delayMs = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 30_000 });
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.log(
        `⚠️  Mongo not ready (attempt ${attempt}/${attempts}), retrying in ${delayMs / 1000}s…`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

export const runSeed = async (): Promise<void> => {
  await connectWithRetry();
  console.log('📦 Connected. Resetting demo collections…');
  await reset();

  // --- Admin + hostel (circular ref: hostelId <-> adminId) ---
  // Reserve the hostel _id first so the admin can reference it at creation
  const hostelId = new mongoose.Types.ObjectId();
  const admin = await Admin.create({
    name: 'Ramesh Iyer',
    email: 'admin@hostelsaas.dev',
    phone: '+919876543210',
    password: DEMO_PASSWORD,
    role: 'admin',
    hostelId,
    permissions: [
      'manage_students',
      'manage_rooms',
      'manage_hostel',
      'manage_mess',
      'manage_complaints',
      'manage_payments',
      'generate_reports',
      'view_analytics',
    ],
  });

  const hostel = await Hostel.create({
    _id: hostelId,
    name: 'Sunrise Boys Hostel',
    description: 'Premium boys hostel with 24/7 security, WiFi and mess.',
    address: '12 College Road, Near University Gate',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411007',
    phone: '+919876543210',
    email: 'sunrise@hostelsaas.dev',
    amenities: ['WiFi', '24/7 Security', 'Mess', 'Laundry', 'Gym', 'Hot Water'],
    rules: ['No outsiders after 10 PM', 'No smoking inside rooms'],
    adminId: admin._id,
  });

  // --- Rooms (3 floors × 4 rooms, mixed types) ---
  const roomDefs = [
    {
      roomNumber: '101',
      floor: 1,
      type: 'double',
      capacity: 2,
      rentPerMonth: 6500,
      depositAmount: 13000,
    },
    {
      roomNumber: '102',
      floor: 1,
      type: 'single',
      capacity: 1,
      rentPerMonth: 9000,
      depositAmount: 18000,
    },
    {
      roomNumber: '103',
      floor: 1,
      type: 'double',
      capacity: 2,
      rentPerMonth: 6500,
      depositAmount: 13000,
    },
    {
      roomNumber: '104',
      floor: 1,
      type: 'triple',
      capacity: 3,
      rentPerMonth: 5000,
      depositAmount: 10000,
    },
    {
      roomNumber: '201',
      floor: 2,
      type: 'double',
      capacity: 2,
      rentPerMonth: 7000,
      depositAmount: 14000,
    },
    {
      roomNumber: '202',
      floor: 2,
      type: 'single',
      capacity: 1,
      rentPerMonth: 9500,
      depositAmount: 19000,
    },
    {
      roomNumber: '203',
      floor: 2,
      type: 'quad',
      capacity: 4,
      rentPerMonth: 4500,
      depositAmount: 9000,
    },
    {
      roomNumber: '204',
      floor: 2,
      type: 'double',
      capacity: 2,
      rentPerMonth: 7000,
      depositAmount: 14000,
    },
    {
      roomNumber: '301',
      floor: 3,
      type: 'triple',
      capacity: 3,
      rentPerMonth: 5500,
      depositAmount: 11000,
    },
    {
      roomNumber: '302',
      floor: 3,
      type: 'double',
      capacity: 2,
      rentPerMonth: 7200,
      depositAmount: 14400,
    },
    {
      roomNumber: '303',
      floor: 3,
      type: 'single',
      capacity: 1,
      rentPerMonth: 9800,
      depositAmount: 19600,
    },
    {
      roomNumber: '304',
      floor: 3,
      type: 'quad',
      capacity: 4,
      rentPerMonth: 4700,
      depositAmount: 9400,
    },
  ];
  const rooms = [];
  for (const def of roomDefs) {
    const room = await Room.create({
      ...def,
      hostelId: hostel._id,
      currentOccupancy: 0,
      status: 'available',
    });
    rooms.push(room);
  }

  // --- Students (one per room for a few rooms) ---
  const studentDefs = [
    { name: 'Aarav Patel', email: 'aarav@student.dev', studentId: 'STU2024001', room: '101' },
    { name: 'Vivaan Desai', email: 'vivaan@student.dev', studentId: 'STU2024002', room: '101' },
    { name: 'Kabir Sharma', email: 'kabir@student.dev', studentId: 'STU2024003', room: '102' },
    { name: 'Ananya Singh', email: 'ananya@student.dev', studentId: 'STU2024004', room: '201' },
    { name: 'Diya Reddy', email: 'diya@student.dev', studentId: 'STU2024005', room: '204' },
  ];
  for (const def of studentDefs) {
    const room = rooms.find((r) => r.roomNumber === def.room);
    const student = await Student.create({
      name: def.name,
      email: def.email,
      phone: '+9198' + Math.floor(10000000 + Math.random() * 89999999),
      password: DEMO_PASSWORD,
      role: 'student',
      studentId: def.studentId,
      hostelId: hostel._id,
      roomId: room?._id,
      parentPhone: '+919800000001',
      address: 'Pune, Maharashtra',
    });
    if (room) {
      room.currentOccupancy += 1;
      const nextStatus: 'available' | 'occupied' | 'maintenance' | 'reserved' =
        room.currentOccupancy >= room.capacity ? 'occupied' : 'available';
      room.status = nextStatus;
      await room.save();
    }
    await Notification.create({
      userId: student._id,
      type: 'room_allocated',
      title: 'Room allocated',
      message: `You have been allocated ${def.room}. Welcome to Sunrise Hostel!`,
    });
  }

  // --- Mess owner + mess + weekly menu ---
  const messOwner = await MessOwner.create({
    name: 'Suresh Kamath',
    email: 'suresh@mess.dev',
    phone: '+919812345678',
    password: DEMO_PASSWORD,
    role: 'mess_owner',
    businessName: 'Kamath Tiffin Services',
    gstNumber: '27ABCDE1234F1Z5',
  });

  const mess = await Mess.create({
    name: 'Kamath Tiffin Services',
    description: 'Home-style veg & non-veg mess serving 500+ students daily.',
    type: 'outside',
    ownerId: messOwner._id,
    address: '14 College Road, Opp. Sunrise Hostel',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411007',
    phone: '+919812345678',
    email: 'suresh@mess.dev',
    cuisineTypes: ['North Indian', 'South Indian', 'Maharashtrian'],
    pricing: {
      monthly: 3500,
      quarterly: 9900,
      halfYearly: 18900,
      yearly: 36000,
      perMeal: { breakfast: 60, lunch: 90, dinner: 90 },
    },
    operatingHours: {
      breakfast: { start: '07:30', end: '09:30' },
      lunch: { start: '12:00', end: '14:30' },
      dinner: { start: '19:00', end: '21:30' },
    },
  });

  const weeklyMenu: Record<string, { breakfast: string[]; lunch: string[]; dinner: string[] }> = {
    monday: {
      breakfast: ['Idli Sambar', 'Filter Coffee'],
      lunch: ['Rice, Dal', 'Aloo Gobi'],
      dinner: ['Roti', 'Paneer Butter Masala'],
    },
    tuesday: {
      breakfast: ['Poha', 'Chai'],
      lunch: ['Rice, Rajma', 'Jeera Aloo'],
      dinner: ['Roti', 'Chana Masala'],
    },
    wednesday: {
      breakfast: ['Upma', 'Coconut Chutney'],
      lunch: ['Rice, Sambar', 'Beans Poriyal'],
      dinner: ['Roti', 'Mix Veg'],
    },
    thursday: {
      breakfast: ['Masala Dosa', 'Sambar'],
      lunch: ['Rice, Dal', 'Bhindi Masala'],
      dinner: ['Roti', 'Dal Makhani'],
    },
    friday: {
      breakfast: ['Aloo Paratha', 'Curd'],
      lunch: ['Rice, Chole', 'Aloo Matar'],
      dinner: ['Roti', 'Shahi Paneer'],
    },
    saturday: {
      breakfast: ['Bread Omelette', 'Toast'],
      lunch: ['Veg Biryani', 'Raita'],
      dinner: ['Noodles', 'Manchurian'],
    },
    sunday: {
      breakfast: ['Chole Bhature'],
      lunch: ['Puri Aloo', 'Kheer'],
      dinner: ['Rice, Dal', 'Papad'],
    },
  };

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;
  await Menu.insertMany(
    days.map((day) => ({
      messId: mess._id,
      dayOfWeek: day,
      meals: {
        breakfast: weeklyMenu[day]!.breakfast.map((name) => ({ name, isVeg: true })),
        lunch: weeklyMenu[day]!.lunch.map((name) => ({ name, isVeg: true })),
        dinner: weeklyMenu[day]!.dinner.map((name) => ({ name, isVeg: true })),
      },
      isPublished: true,
    }))
  );

  // Link mess to owner + admin hostel mess
  messOwner.messId = mess._id;
  await messOwner.save();

  console.log('✅ Seed complete!');
  console.log('──────────────────────────────────────');
  console.log(`Admin       : admin@hostelsaas.dev / ${DEMO_PASSWORD}`);
  console.log(`Students    : aarav@student.dev … / ${DEMO_PASSWORD}`);
  console.log(`Mess Owner  : suresh@mess.dev / ${DEMO_PASSWORD}`);
  console.log(`Hostel      : ${hostel.name} (${rooms.length} rooms)`);
  console.log(`Mess        : ${mess.name}`);
  console.log('──────────────────────────────────────');

  await mongoose.disconnect();
};

// CLI entry: `npm run seed` — auto-run only when executed directly
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMain) {
  runSeed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}

import type { AuthenticatedRequest } from '../middleware/auth.js';
import { isAdminUser } from '../utils/userGuards.js';
import type { Response } from 'express';
import { Room, RoomAllocation, Student, Hostel } from '../models/index.js';
import mongoose from 'mongoose';

export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hostelId, ...roomData } = req.body;

    // Verify hostel exists and admin owns it
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      res.status(404).json({ error: 'Hostel not found' });
      return;
    }

    if (isAdminUser(req.user) && !hostel._id.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const room = await Room.create({
      ...roomData,
      hostelId,
      currentOccupancy: 0,
      status: 'available',
    });

    res.status(201).json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      res.status(409).json({ error: 'Room number already exists in this hostel' });
      return;
    }
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const getRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Filter by hostel
    if (req.query.hostelId) {
      filter.hostelId = req.query.hostelId;
    } else if (isAdminUser(req.user)) {
      filter.hostelId = req.user.hostelId;
    }

    // Students see only available rooms
    if (req.tokenPayload?.role === 'student') {
      filter.status = 'available';
    }

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate('hostelId', 'name')
        .sort({ floor: 1, roomNumber: 1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments(filter),
    ]);

    res.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
};

export const getRoomById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id).populate('hostelId', 'name address');
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check access
    if (isAdminUser(req.user) && !room.hostelId.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get current occupants
    const allocations = await RoomAllocation.find({ roomId: room._id, isActive: true }).populate(
      'studentId',
      'name studentId phone'
    );

    res.json({ room, occupants: allocations });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
};

export const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check ownership
    if (isAdminUser(req.user) && !room.hostelId.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    Object.assign(room, req.body);
    await room.save();

    res.json({ room });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check ownership
    if (isAdminUser(req.user) && !room.hostelId.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if room has active allocations
    const activeAllocations = await RoomAllocation.countDocuments({
      roomId: room._id,
      isActive: true,
    });
    if (activeAllocations > 0) {
      res.status(400).json({ error: 'Cannot delete room with active occupants' });
      return;
    }

    await room.deleteOne();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

export const allocateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId, studentId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check ownership
    if (isAdminUser(req.user) && !room.hostelId.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check room availability
    if (room.status !== 'available' && room.currentOccupancy >= room.capacity) {
      res.status(400).json({ error: 'Room is not available' });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Check if student already has an active allocation
    const existingAllocation = await RoomAllocation.findOne({ studentId, isActive: true });
    if (existingAllocation) {
      res.status(400).json({ error: 'Student already has an active room allocation' });
      return;
    }

    // Create allocation
    const allocation = await RoomAllocation.create({
      roomId,
      studentId,
      allocatedAt: new Date(),
      isActive: true,
    });

    // Update room occupancy
    room.currentOccupancy += 1;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'occupied';
    }
    await room.save();

    // Update student's room reference
    student.roomId = room._id;
    student.hostelId = room.hostelId;
    await student.save();

    res.status(201).json({ allocation });
  } catch (error) {
    console.error('Allocate room error:', error);
    res.status(500).json({ error: 'Failed to allocate room' });
  }
};

export const deallocateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const allocation = await RoomAllocation.findOne({ roomId, isActive: true });
    if (!allocation) {
      res.status(404).json({ error: 'No active allocation found for this room' });
      return;
    }

    // Check ownership
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (isAdminUser(req.user) && !room.hostelId.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Deactivate allocation
    allocation.isActive = false;
    allocation.vacatedAt = new Date();
    await allocation.save();

    // Update room occupancy
    room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
    if (room.currentOccupancy < room.capacity) {
      room.status = 'available';
    }
    await room.save();

    // Update student's room reference
    await Student.findByIdAndUpdate(allocation.studentId, {
      $unset: { roomId: 1 },
    });

    res.json({ message: 'Room deallocated successfully' });
  } catch (error) {
    console.error('Deallocate room error:', error);
    res.status(500).json({ error: 'Failed to deallocate room' });
  }
};

export const getRoomsByHostel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hostelId } = req.params;

    // Check access
    if (isAdminUser(req.user) && !req.user.hostelId.equals(new mongoose.Types.ObjectId(hostelId))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const rooms = await Room.find({ hostelId }).sort({ floor: 1, roomNumber: 1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms by hostel error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
};

export const checkAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const availableSlots = room.capacity - room.currentOccupancy;

    res.json({
      available: availableSlots > 0,
      availableSlots,
      capacity: room.capacity,
      currentOccupancy: room.currentOccupancy,
      status: room.status,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

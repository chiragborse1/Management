import type { AuthenticatedRequest } from '../middleware/auth.js';
import { isAdminUser } from '../utils/userGuards.js';
import type { Response } from 'express';
import { Hostel, Room, Student } from '../models/index.js';

export const createHostel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.create({
      ...req.body,
      adminId: req.user!._id,
    });

    res.status(201).json({ hostel });
  } catch (error) {
    console.error('Create hostel error:', error);
    res.status(500).json({ error: 'Failed to create hostel' });
  }
};

export const getHostels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Students can only see active hostels
    if (req.tokenPayload?.role === 'student') {
      filter.isActive = true;
    }

    // Admins can only see their own hostel unless superadmin
    if (isAdminUser(req.user)) {
      filter._id = req.user.hostelId;
    }

    const [hostels, total] = await Promise.all([
      Hostel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Hostel.countDocuments(filter),
    ]);

    res.json({
      hostels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get hostels error:', error);
    res.status(500).json({ error: 'Failed to get hostels' });
  }
};

export const getHostelById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      res.status(404).json({ error: 'Hostel not found' });
      return;
    }

    // Check access permissions
    if (req.tokenPayload?.role === 'student' && !hostel.isActive) {
      res.status(404).json({ error: 'Hostel not found' });
      return;
    }

    if (isAdminUser(req.user) && !hostel._id.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ hostel });
  } catch (error) {
    console.error('Get hostel error:', error);
    res.status(500).json({ error: 'Failed to get hostel' });
  }
};

export const updateHostel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      res.status(404).json({ error: 'Hostel not found' });
      return;
    }

    // Check ownership
    if (isAdminUser(req.user) && !hostel._id.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    Object.assign(hostel, req.body);
    await hostel.save();

    res.json({ hostel });
  } catch (error) {
    console.error('Update hostel error:', error);
    res.status(500).json({ error: 'Failed to update hostel' });
  }
};

export const deleteHostel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      res.status(404).json({ error: 'Hostel not found' });
      return;
    }

    // Check ownership
    if (isAdminUser(req.user) && !hostel._id.equals(req.user.hostelId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Soft delete
    hostel.isActive = false;
    await hostel.save();

    res.json({ message: 'Hostel deactivated successfully' });
  } catch (error) {
    console.error('Delete hostel error:', error);
    res.status(500).json({ error: 'Failed to delete hostel' });
  }
};

export const getHostelRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.params.id;

    const rooms = await Room.find({ hostelId })
      .populate('allocations', 'studentId')
      .sort({ floor: 1, roomNumber: 1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get hostel rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
};

export const getHostelStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.params.id;

    const [totalRooms, occupiedRooms, totalStudents, availableRooms] = await Promise.all([
      Room.countDocuments({ hostelId }),
      Room.countDocuments({ hostelId, status: 'occupied' }),
      Student.countDocuments({ hostelId }),
      Room.countDocuments({ hostelId, status: 'available' }),
    ]);

    res.json({
      stats: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms: totalRooms - occupiedRooms - availableRooms,
        totalStudents,
        occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Get hostel stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

import { Response } from 'express';
import { DeviceModel } from '../models/Device';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllDevices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const devices = await DeviceModel.findAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

export const getDeviceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const device = await DeviceModel.findById(parseInt(id));

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device' });
  }
};

export const getDevicesByHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveId } = req.params;
    const devices = await DeviceModel.findByHiveId(parseInt(hiveId));
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

export const createDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceName, esp32Serial, hiveId, status } = req.body;

    if (!deviceName || !esp32Serial || !hiveId) {
      return res.status(400).json({ error: 'deviceName, esp32Serial, and hiveId are required' });
    }

    const device = await DeviceModel.create(deviceName, esp32Serial, hiveId, status || 'active');
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create device' });
  }
};

export const updateDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deviceName, status } = req.body;

    if (!deviceName || !status) {
      return res.status(400).json({ error: 'deviceName and status are required' });
    }

    const device = await DeviceModel.update(parseInt(id), deviceName, status);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device' });
  }
};

export const deleteDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await DeviceModel.delete(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

import { Response } from 'express';
import { HiveModel } from '../models/Hive';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllHives = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hives = await HiveModel.findAll();
    res.json(hives);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hives' });
  }
};

export const getHiveById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const hive = await HiveModel.findById(parseInt(id));

    if (!hive) {
      return res.status(404).json({ error: 'Hive not found' });
    }

    res.json(hive);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hive' });
  }
};

export const createHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveName, location, description } = req.body;

    if (!hiveName || !location) {
      return res.status(400).json({ error: 'hiveName and location are required' });
    }

    const hive = await HiveModel.create(hiveName, location, description);
    res.status(201).json(hive);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hive' });
  }
};

export const updateHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { hiveName, location, description } = req.body;

    if (!hiveName || !location) {
      return res.status(400).json({ error: 'hiveName and location are required' });
    }

    const hive = await HiveModel.update(parseInt(id), hiveName, location, description);

    if (!hive) {
      return res.status(404).json({ error: 'Hive not found' });
    }

    res.json(hive);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hive' });
  }
};

export const deleteHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await HiveModel.delete(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Hive not found' });
    }

    res.json({ message: 'Hive deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hive' });
  }
};

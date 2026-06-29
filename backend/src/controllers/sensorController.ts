import { Response } from 'express';
import { SensorReadingModel } from '../models/SensorReading';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateBeeStress } from '../utils/beeStress';

export const getSensorReadings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const readings = await SensorReadingModel.findAll();
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
};

export const getSensorReadingsByHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveId } = req.params;
    const { limit } = req.query;
    const readings = await SensorReadingModel.findByHiveId(
      parseInt(hiveId),
      parseInt((limit as string) || '100')
    );
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
};

export const getSensorReadingsByHiveAndTimeRange = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveId } = req.params;
    const { startTime, endTime, limit } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' });
    }

    const readings = await SensorReadingModel.findByHiveIdAndTimeRange(
      parseInt(hiveId),
      new Date(startTime as string),
      new Date(endTime as string),
      parseInt((limit as string) || '1000')
    );
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
};

export const getLatestSensorReadingByHive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveId } = req.params;
    const reading = await SensorReadingModel.findLatestByHiveId(parseInt(hiveId));

    if (!reading) {
      return res.status(404).json({ error: 'No sensor readings found' });
    }

    res.json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor reading' });
  }
};

export const createSensorReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hiveId, temperature, humidity, soundLevel, deviceId } = req.body;

    if (hiveId === undefined || temperature === undefined || humidity === undefined || soundLevel === undefined) {
      return res.status(400).json({ error: 'hiveId, temperature, humidity, and soundLevel are required' });
    }

    const beeStress = calculateBeeStress(soundLevel);

    const reading = await SensorReadingModel.create(
      hiveId,
      temperature,
      humidity,
      soundLevel,
      beeStress,
      deviceId
    );

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sensor reading' });
  }
};

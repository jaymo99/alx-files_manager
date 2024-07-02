const redisClient = require('../utils/redis');
const { dbClient } = require('../utils/db');

const getStatus = async (req, res) => {
  try {
    const redisAlive = await redisClient.isAlive();
    const dbAlive = await dbClient.isAlive();

    res.status(200).json({ redis: redisAlive, db: dbAlive });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getStats = async (req, res) => {
  try {
    const numUsers = await dbClient.nbUsers();
    const numFiles = await dbClient.nbFiles();

    res.status(200).json({ users: numUsers, files: numFiles });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getStatus,
  getStats,
};

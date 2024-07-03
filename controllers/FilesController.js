const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const dbClient = require('../utils/db').default;
const redisClient = require('../utils/redis');

const postUpload = async (req, res) => {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    name, type, parentId = 0, isPublic = false, data,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  if (!['folder', 'file', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }

  if (type !== 'folder' && !data) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const parentFile = parentId !== 0 ? await dbClient.db.collection('files').findOne({ _id: parentId }) : null;
  if (parentId !== 0 && !parentFile) {
    return res.status(400).json({ error: 'Parent not found' });
  }

  if (parentFile && parentFile.type !== 'folder') {
    return res.status(400).json({ error: 'Parent is not a folder' });
  }

  const fileDocument = {
    userId,
    name,
    type,
    isPublic,
    parentId,
  };

  if (type === 'folder') {
    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json({ id: result.insertedId, ...fileDocument });
  }
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  await fs.mkdir(folderPath, { recursive: true });

  const localPath = path.join(folderPath, uuidv4());
  await fs.writeFile(localPath, Buffer.from(data, 'base64'));

  fileDocument.localPath = localPath;
  const result = await dbClient.db.collection('files').insertOne(fileDocument);

  return res.status(201).json({ id: result.insertedId, ...fileDocument });
};

const getShow = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const fileId = req.params.id;
  if (!ObjectId.isValid(fileId)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json(file);
};

const getIndex = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parentId = req.query.parentId || '0';
  const page = parseInt(req.query.page, 10) || 0;
  const pageSize = 20;
  const skip = page * pageSize;

  let parentObjectId = parentId;
  if (parentId !== '0' && ObjectId.isValid(parentId)) {
    parentObjectId = new ObjectId(parentId);
  } else if (parentId !== '0') {
    return res.status(400).json({ error: 'Invalid parentId' });
  }

  const files = await dbClient.db.collection('files').aggregate([
    { $match: { userId: new ObjectId(userId), parentId: parentObjectId } },
    { $skip: skip },
    { $limit: pageSize },
  ]).toArray();

  return res.status(200).json(files);
};

module.exports = {
  postUpload,
  getShow,
  getIndex,
};

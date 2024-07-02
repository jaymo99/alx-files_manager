const crypto = require('crypto');
const { dbClient, ObjectId } = require('../utils/db');
const redisClient = require('../utils/redis');

const postNew = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  const existingUser = await dbClient.db.collection('users').findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Already exists' });
  }

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  const newUser = {
    email,
    password: hashedPassword,
  };

  try {
    const result = await dbClient.db.collection('users').insertOne(newUser);
    return res.status(201).json({ id: result.insertedId, email: newUser.email });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getMe = async (req, res) => {
  const { 'x-token': token } = req.headers;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = `auth_${token}`;
  let user = null;
  try {
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) }, { projection: { email: 1 } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ error: `getMe Error: ${error}` });
  }

  return res.status(200).json({ id: user._id.toString(), email: user.email });
};

module.exports = {
  postNew,
  getMe,
};

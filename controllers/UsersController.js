const crypto = require('crypto');
const dbClient = require('../utils/db').default;

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

module.exports = {
  postNew,
};

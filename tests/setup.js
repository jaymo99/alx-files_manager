const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    dbClient.db = mongoose.connection;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    redisClient.client.quit();
});

const dbClient = require('../utils/db');

describe('dbClient', () => {
    test('should connect to the database', async () => {
        const connection = await dbClient.db;
        expect(connection).toBeDefined();
    });

    test('should insert a document into collection', async () => {
        const collection = dbClient.db.collection('test');
        const result = await collection.insertOne({ name: 'test' });
        expect(result.insertedCount).toBe(1);
    });

    test('should find a document in collection', async () => {
        const collection = dbClient.db.collection('test');
        await collection.insertOne({ name: 'test' });
        const result = await collection.findOne({ name: 'test' });
        expect(result.name).toBe('test');
    });
});

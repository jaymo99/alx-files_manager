const redisClient = require('../utils/redis');

describe('redisClient', () => {
    beforeAll(() => {
        redisClient.client.set = jest.fn();
        redisClient.client.get = jest.fn();
        redisClient.client.del = jest.fn();
    });

    test('should set a value in redis', async () => {
        redisClient.client.set.mockResolvedValue('OK');
        const result = await redisClient.set('key', 'value');
        expect(result).toBe('OK');
    });

    test('should get a value from redis', async () => {
        redisClient.client.get.mockResolvedValue('value');
        const result = await redisClient.get('key');
        expect(result).toBe('value');
    });

    test('should delete a value from redis', async () => {
        redisClient.client.del.mockResolvedValue(1);
        const result = await redisClient.del('key');
        expect(result).toBe(1);
    });
});

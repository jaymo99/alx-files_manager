import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;

    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB connection error:', err);
      } else {
        console.log('Connected successfully to MongoDB');
        this.db = this.client.db(this.dbName);
      }
    });
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    if (!this.db) {
      return 0;
    }
    const usersCollection = this.db.collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.db) {
      return 0;
    }
    const filesCollection = this.db.collection('files');
    return filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;

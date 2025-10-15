const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return {
            client: cachedClient,
            db: cachedDb
        };
    }

    let uri = process.env.MONGO_URI;

    // If MONGO_URI is missing or doesn't start with a valid scheme, try to build
    // a local fallback using MONGO_DBNAME so the app can run locally.
    const hasValidScheme = typeof uri === 'string' && /^mongodb(\+srv)?:\/\//.test(uri);
    const dbName = process.env.MONGO_DBNAME || 'admin';

    if (!hasValidScheme) {
        if (!process.env.MONGO_DBNAME && !hasValidScheme) {
            throw new Error('MONGO_URI environment variable is not set or invalid, and MONGO_DBNAME is not provided to build a fallback.');
        }
        // Build a fallback local URI using the DB name
        uri = `mongodb://localhost:27017/${dbName}`;
        console.warn('MONGO_URI missing or invalid. Falling back to', uri);
    }

    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();

        // Also set up mongoose connection and ensure it uses the same DB name
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName
        });

        const db = client.db(dbName);
        
        // Test the connection
        await db.command({ ping: 1 });
        console.log("MongoDB connection established successfully!");

        cachedClient = client;
        cachedDb = db;

        return {
            client: cachedClient,
            db: cachedDb
        };
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = connectToDatabase;
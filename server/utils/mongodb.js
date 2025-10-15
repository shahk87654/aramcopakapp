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

    // Accept multiple common env var names used by different hosts/providers
    let uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.DB_URI;

    // Helper: try to build a URI from component parts if provided
    const buildFromComponents = () => {
        const host = process.env.MONGO_HOST || process.env.DB_HOST || 'localhost';
        const port = process.env.MONGO_PORT || process.env.DB_PORT || '27017';
        const dbName = process.env.MONGO_DBNAME || process.env.DB_NAME;
        const user = process.env.MONGO_USER || process.env.DB_USER;
        const pass = process.env.MONGO_PASS || process.env.DB_PASS;

        if (!dbName) return null;

        if (user && pass) {
            return { uri: `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}`, dbName };
        }

        return { uri: `mongodb://${host}:${port}/${dbName}`, dbName };
    };

    const hasValidScheme = typeof uri === 'string' && /^mongodb(\+srv)?:\/\//.test(uri);
    let dbName = process.env.MONGO_DBNAME || process.env.DB_NAME || 'admin';

    if (!hasValidScheme) {
        // Try building from component environment variables (useful on Railway/other platforms)
        const built = buildFromComponents();
        if (built) {
            uri = built.uri;
            dbName = built.dbName;
            console.warn('MONGO_URI missing or invalid. Built connection URI from components and falling back to', uri);
        }
    }

    if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri)) {
        // Provide an actionable error explaining how to fix this in the host
        const hint = `Set one of MONGO_URI, MONGODB_URI, DATABASE_URL, or provide components MONGO_HOST/MONGO_PORT/MONGO_DBNAME (and optional MONGO_USER/MONGO_PASS). Example: MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mydb`;
        throw new Error(`MONGO_URI environment variable is not set or invalid, and a fallback could not be built. ${hint}`);
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
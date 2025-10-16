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
    // Include a few common nonstandard aliases some users/platforms may create (lowercase 'mongodb', 'MONGO')
    const envCandidates = ['MONGO_URI','MONGODB_URI','DATABASE_URL','DB_URI','MONGO','mongodb','MONGODB'];
    let uri = null;
    let usedEnvVar = null;
    for (const name of envCandidates) {
        if (typeof process.env[name] === 'string' && process.env[name].length > 0) {
            uri = process.env[name];
            usedEnvVar = name;
            break;
        }
    }

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
    let dbName = process.env.MONGO_DBNAME || process.env.DB_NAME || null;

    if (!hasValidScheme) {
        // Try building from component environment variables (useful on Railway/other platforms)
        const built = buildFromComponents();
        if (built) {
            uri = built.uri;
            dbName = built.dbName;
            // Built URI from components; don't print credentials but report fallback
            console.warn('MONGO_URI missing or invalid. Built connection URI from components and falling back to', '[built-from-components]');
        }
    }

    // If the URI contains an explicit database name, use it (handles mongodb+srv://.../mydb?...)
    if (uri && /^mongodb(\+srv)?:\/\//.test(uri) && !dbName) {
        const m = uri.match(/\/([^\/?]+)(?:\?|$)/);
        if (m && m[1]) {
            dbName = m[1];
            console.log('Detected database name from URI:', dbName);
        }
    }

    if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri)) {
        // Provide an actionable error explaining how to fix this in the host
        const hint = `Set one of MONGO_URI, MONGODB_URI, DATABASE_URL (or use MONGO / mongodb / DB_URI), or provide components MONGO_HOST/MONGO_PORT/MONGO_DBNAME (and optional MONGO_USER/MONGO_PASS). Example: MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mydb`;
        throw new Error(`MONGO_URI environment variable is not set or invalid, and a fallback could not be built. ${hint}`);
    }

    // Helpful diagnostic: log which environment variable provided the URI (only the name, never the secret)
    if (usedEnvVar) {
        console.log('Mongo environment variable detected:', usedEnvVar);
    } else if (dbName && uri) {
        console.log('Mongo connection built from components (MONGO_HOST/MONGO_DBNAME etc.).');
    } else {
        console.log('No Mongo environment variable detected at connection time.');
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
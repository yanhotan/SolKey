print('Start MongoDB initialization...');

db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

// Wait for the replica set to be initiated
function waitForReplicaSet() {
    let attempts = 30;
    while (attempts > 0) {
        try {
            const status = rs.status();
            if (status.ok) {
                return true;
            }
        } catch (err) {
            print("Waiting for replica set...");
        }
        sleep(1000);
        attempts--;
    }
    return false;
}

// Create application database and user
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'solkey');

// Create application user if it doesn't exist
if (!db.getUser(process.env.MONGO_INITDB_ROOT_USERNAME)) {
    db.createUser({
        user: process.env.MONGO_INITDB_ROOT_USERNAME,
        pwd: process.env.MONGO_INITDB_ROOT_PASSWORD,
        roles: [
            { role: "readWrite", db: process.env.MONGO_INITDB_DATABASE || 'solkey' }
        ]
    });
}

// Create collections with schema validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "name"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                name: { bsonType: "string" },
                walletAddress: { bsonType: "string" }
            }
        }
    }
});

db.createCollection("projects", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name"],
            properties: {
                name: { bsonType: "string" },
                description: { bsonType: ["string", "null"] },
                environments: { 
                    bsonType: "array",
                    items: { 
                        oneOf: [
                            { bsonType: "string" },
                            { bsonType: "objectId" }
                        ]
                    }
                }
            }
        }
    }
});

db.createCollection("environments", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "projectId"],
            properties: {
                name: { bsonType: "string" },
                projectId: { bsonType: "objectId" },
                type: { 
                    bsonType: "string",
                    enum: ["development", "staging", "production", "custom"]
                }
            }
        }
    }
});

db.createCollection("secrets", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["key", "encryptedValue", "environmentId"],
            properties: {
                key: { bsonType: "string" },
                encryptedValue: { bsonType: "string" },
                environmentId: { bsonType: "objectId" }
            }
        }
    }
});

// Create indices
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "walletAddress": 1 }, { unique: true, sparse: true });
db.projects.createIndex({ "name": "text", "description": "text" });
db.environments.createIndex({ "projectId": 1, "name": 1 }, { unique: true });
db.secrets.createIndex({ "environmentId": 1, "key": 1 }, { unique: true });

print("Database initialization completed successfully");
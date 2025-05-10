db = db.getSiblingDB('solkey');

db.createUser({
    user: 'solkey_user',
    pwd: 'solkey_password',
    roles: [
        { role: 'readWrite', db: 'solkey' },
        { role: 'dbAdmin', db: 'solkey' }
    ]
});

// Create collections
db.createCollection('users');
db.createCollection('secrets');
db.createCollection('projects');
db.createCollection('environments');
db.createCollection('teams');

#!/bin/bash
set -e

# Wait for MongoDB to start
until mongosh --host mongodb:27017 --eval "print('waiting for connection')"
do
    sleep 1
done

# Initialize replica set
mongosh --host mongodb:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "mongodb:27017" }]
});

// Wait for the replica set to initialize
while (!rs.isMaster().ismaster) {
  sleep(1000);
}
EOF

echo "MongoDB replica set initialized"
#!/bin/bash
set -e

# Copy keyfile to data directory and set proper permissions
cp /mongodb-keyfile /data/mongodb-keyfile
chown mongodb:mongodb /data/mongodb-keyfile
chmod 400 /data/mongodb-keyfile

# Start mongod with proper configuration
exec mongod --auth --bind_ip_all --replSet rs0 --keyFile /data/mongodb-keyfile "$@"

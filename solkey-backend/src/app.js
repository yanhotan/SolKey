const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const paymentsRoutes = require('./routes/payments.routes');
const projectsRoutes = require('./routes/projects.routes');
const secretsRoutes = require('./routes/secrets.routes');
const teamsRoutes = require('./routes/teams.routes');

const errorMiddleware = require('./middleware/error.middleware');
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

require('./config/passport');
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/payments', authenticateToken, paymentsRoutes);
app.use('/api/projects', authenticateToken, projectsRoutes);
app.use('/api/secrets', authenticateToken, secretsRoutes);
app.use('/api/teams', authenticateToken, teamsRoutes);

app.use(errorMiddleware);

module.exports = app;
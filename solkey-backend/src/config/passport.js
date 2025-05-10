const passport = require('passport');
const User = require('../models/user.model');
const config = require('./auth');

async function findOrCreateUser(profile) {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
        user = await User.create({
            email: profile.emails[0].value,
            name: profile.displayName,
            profileImage: profile.photos[0]?.value
        });
    }
    return user;
}

// Only set up OAuth strategies if credentials are configured
if (config.oauth?.google?.clientId && config.oauth?.google?.clientSecret) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    passport.use(new GoogleStrategy({
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL
    }, async (_, __, profile, done) => {
        try {
            const user = await findOrCreateUser(profile);
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Only set up GitHub strategy if credentials are configured
if (config.oauth?.github?.clientId && config.oauth?.github?.clientSecret) {
    const GitHubStrategy = require('passport-github2').Strategy;
    passport.use(new GitHubStrategy({
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackURL
    }, async (_, __, profile, done) => {
        try {
            const user = await findOrCreateUser(profile);
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
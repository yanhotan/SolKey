const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create a new user
router.post("/", async (req, res) => {
  try {
    console.log('Creating user with data:', req.body);
    const { wallet_address, username, email } = req.body;

    // Validate required fields
    if (!wallet_address) {
      console.log('Missing wallet address');
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }    // If username isn't provided, generate one from wallet address
    let finalUsername = username || `user_${wallet_address.substring(0, 8)}`;
    
    const finalEmail = email || `${wallet_address.substring(0, 5)}@gmail.com`;

    // Validate wallet address format (basic Solana address validation)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)) {
      console.log('Invalid wallet address format:', wallet_address);
      return res.status(400).json({
        error: "Invalid wallet address format",
      });
    }

    // Check if wallet address already exists
    const { data: existingWallet, error: walletError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", wallet_address)
      .single();

    if (existingWallet) {
      return res.status(409).json({
        error: "Wallet address already registered",
      });
    }    // Check if username already exists
    const { data: existingUsername, error: usernameError } = await supabase
      .from("users")
      .select("id")
      .eq("username", finalUsername)
      .single();

    if (existingUsername) {
      const uniqueSuffix = Math.floor(Math.random() * 1000);
      finalUsername = `${finalUsername}_${uniqueSuffix}`;
    }

    // Create the user
    const { data: user, error: createError } = await supabase
      .from("users")
      .insert([
        {
          wallet_address,
          username: finalUsername,
          email: finalEmail,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    // Return user data (excluding sensitive information)
    res.status(201).json({
      id: user.id,
      wallet_address: user.wallet_address,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by wallet address
router.get("/wallet/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    console.log('Looking up user by wallet address:', wallet_address);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, wallet_address, username, email, created_at")
      .eq("wallet_address", wallet_address)
      .single();

    if (error) {
      console.error('Supabase error fetching user:', error);
      throw error;
    }
    
    if (!user) {
      console.log('User not found for wallet address:', wallet_address);
      return res.status(404).json({ error: "User not found" });
    }

    console.log('User found:', { id: user.id, username: user.username });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by query parameters
router.get("/", async (req, res) => {
  try {
    const { wallet } = req.query;
    
    // If wallet query is provided, search by wallet address
    if (wallet) {
      console.log('Looking up user by wallet address query param:', wallet);
      
      const { data: users, error } = await supabase
        .from("users")
        .select("id, wallet_address, username, email, created_at")
        .eq("wallet_address", wallet);
      
      if (error) {
        console.error('Supabase error fetching users:', error);
        throw error;
      }
      
      console.log('Users found:', users.length);
      return res.json(users);
    }
    
    // Handle other query parameters or return all users (with pagination)
    const { data: users, error } = await supabase
      .from("users")
      .select("id, wallet_address, username, email, created_at")
      .limit(100);
      
    if (error) {
      console.error('Supabase error fetching all users:', error);
      throw error;
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

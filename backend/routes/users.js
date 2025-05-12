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
    const { wallet_address, username, email } = req.body;

    // Validate required fields
    if (!wallet_address || !username) {
      return res.status(400).json({
        error: "Wallet address and username are required",
      });
    }

    // Validate wallet address format (basic Solana address validation)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)) {
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
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUsername) {
      return res.status(409).json({
        error: "Username already taken",
      });
    }

    // Create the user
    const { data: user, error: createError } = await supabase
      .from("users")
      .insert([
        {
          wallet_address,
          username,
          email: email || null,
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

    const { data: user, error } = await supabase
      .from("users")
      .select("id, wallet_address, username, email, created_at")
      .eq("wallet_address", wallet_address)
      .single();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

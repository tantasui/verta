import express from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Register with email/password
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      throw new AppError('Username, email, and password are required', 400);
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [username, email, hashedPassword, displayName || username]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Login with email/password
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, password, display_name, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Connect wallet (Sui wallet authentication)
router.post('/wallet/connect', async (req, res, next) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress) {
      throw new AppError('Wallet address is required', 400);
    }

    // TODO: Verify Sui wallet signature
    // For now, we'll just check if wallet exists or create user

    // Check if user with wallet exists
    let result = await pool.query(
      'SELECT id, username, email, display_name, avatar_url, wallet_address FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user with wallet
      const username = `user_${walletAddress.slice(0, 8)}`;
      result = await pool.query(
        `INSERT INTO users (username, wallet_address, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, username, wallet_address, display_name, avatar_url`,
        [username, walletAddress, username]
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Wallet connected successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        walletAddress: user.wallet_address,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

/**
 * Integration Tests: User Registration API Endpoint
 * Test Spec: TS0001
 * Story: US0001 - User Registration API Endpoint
 *
 * These tests verify all acceptance criteria for user registration:
 * - AC1: Successful registration with valid inputs
 * - AC2: Email format validation
 * - AC3: Duplicate email prevention
 * - AC4: Duplicate username prevention (case-insensitive)
 * - AC5: Username format validation
 * - AC6: Password strength validation
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';

describe('POST /api/v1/auth/register', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // TC001: Successful Registration - Happy Path (AC1)
  describe('TC001: Successful Registration - Happy Path', () => {
    it('should create user with valid email, username, and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');

      // Verify user exists in database
      const user = await User.findById(response.body.data.userId);
      expect(user).toBeTruthy();
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBe('test@example.com');

      // Verify password is hashed with bcrypt
      expect(user?.passwordHash).toMatch(/^\$2[ab]\$/); // bcrypt hash format
      expect(user?.passwordHash).not.toBe('password123'); // not plaintext
      expect(user?.passwordHash).toHaveLength(60); // bcrypt hash length

      // Verify bcrypt can validate the password
      const isPasswordValid = await bcrypt.compare('password123', user!.passwordHash);
      expect(isPasswordValid).toBe(true);
    });
  });

  // TC002: Invalid Email Format (AC2)
  describe('TC002: Invalid Email Format', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'notanemail',
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/email.*invalid/i);

      // Verify no user was created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });

    it('should reject email without domain', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@domain',
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // TC003: Duplicate Email Prevention (AC3)
  describe('TC003: Duplicate Email Prevention', () => {
    it('should return 409 when email already exists', async () => {
      // Create existing user
      await User.create({
        email: 'existing@example.com',
        username: 'existinguser',
        passwordHash: await bcrypt.hash('password123', 10)
      });

      // Attempt to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          username: 'newuser',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Email already registered');

      // Verify only one user with that email
      const count = await User.countDocuments({ email: 'existing@example.com' });
      expect(count).toBe(1);
    });
  });

  // TC004: Duplicate Username Prevention - Exact Match (AC4)
  describe('TC004: Duplicate Username Prevention (Exact Match)', () => {
    it('should return 409 when username already exists', async () => {
      // Create existing user
      await User.create({
        email: 'existing@example.com',
        username: 'johndoe',
        passwordHash: await bcrypt.hash('password123', 10)
      });

      // Attempt to register with same username
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'new@example.com',
          username: 'johndoe',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Username already taken');

      // Verify only one user with that username
      const count = await User.countDocuments({ username: 'johndoe' });
      expect(count).toBe(1);
    });
  });

  // TC005: Duplicate Username Prevention - Case-Insensitive (AC4)
  describe('TC005: Duplicate Username Prevention (Case-Insensitive)', () => {
    it('should return 409 when username exists with different case', async () => {
      // Create existing user with lowercase username
      await User.create({
        email: 'existing@example.com',
        username: 'johndoe',
        passwordHash: await bcrypt.hash('password123', 10)
      });

      // Attempt to register with different case
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'new@example.com',
          username: 'JohnDoe',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Username already taken');

      // Verify username check is case-insensitive
      const count = await User.countDocuments();
      expect(count).toBe(1); // Only original user exists
    });
  });

  // TC006: Username Too Short (AC5)
  describe('TC006: Username Too Short', () => {
    it('should return 400 for username with 2 characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/3-30 chars|too short/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC007: Username Too Long (AC5)
  describe('TC007: Username Too Long', () => {
    it('should return 400 for username with 31+ characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'this_is_a_very_long_username_that_exceeds_thirty_characters',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/3-30 chars|too long/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC008: Password Too Short (AC6)
  describe('TC008: Password Too Short', () => {
    it('should return 400 for password with 7 characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'pass123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Password must be at least 8 characters');

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC009: Username With Special Characters (AC5)
  describe('TC009: Username With Special Characters', () => {
    it('should return 400 for username with @ symbol', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'john@doe',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/alphanumeric|underscore/i);
    });

    it('should return 400 for username with space', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'john doe',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // TC010: Password Exactly 8 Characters (AC1, AC6)
  describe('TC010: Password Exactly 8 Characters', () => {
    it('should accept password with exactly 8 characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'pass1234'
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify user created and password hashed
      const user = await User.findById(response.body.data.userId);
      expect(user).toBeTruthy();
      const isPasswordValid = await bcrypt.compare('pass1234', user!.passwordHash);
      expect(isPasswordValid).toBe(true);
    });
  });

  // TC011: Missing Required Field - Email
  describe('TC011: Missing Required Field - Email', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/email.*required/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC012: Missing Required Field - Username
  describe('TC012: Missing Required Field - Username', () => {
    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/username.*required/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC013: Missing Required Field - Password
  describe('TC013: Missing Required Field - Password', () => {
    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/password.*required/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC014: Empty Email String
  describe('TC014: Empty Email String', () => {
    it('should return 400 for empty email string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: '',
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/email.*invalid|required/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC015: Whitespace-Only Username
  describe('TC015: Whitespace-Only Username', () => {
    it('should return 400 for whitespace-only username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: '   ',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/username.*invalid/i);

      // Verify no user created
      const count = await User.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC016: Email With Uppercase Letters
  describe('TC016: Email With Uppercase Letters', () => {
    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'User@EXAMPLE.COM',
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify email stored as lowercase
      const user = await User.findById(response.body.data.userId);
      expect(user?.email).toBe('user@example.com');
      expect(response.body.data.email).toBe('user@example.com');
    });
  });

  // TC017: Username With Mixed Case Storage
  describe('TC017: Username With Mixed Case Storage', () => {
    it('should preserve username case in storage', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'JohnDoe',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify username stored with original case
      const user = await User.findById(response.body.data.userId);
      expect(user?.username).toBe('JohnDoe'); // Exact case preserved
      expect(response.body.data.username).toBe('JohnDoe');
    });
  });

  // TC018: Password Hash Verification
  describe('TC018: Password Hash Verification', () => {
    it('should store bcrypt hash, not plaintext password', async () => {
      const plainPassword = 'securepass123';

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: plainPassword
        })
        .expect(201);

      // Query database for user
      const user = await User.findById(response.body.data.userId);
      expect(user).toBeTruthy();

      // Verify bcrypt hash format
      expect(user?.passwordHash).toMatch(/^\$2[ab]\$/); // Starts with $2a$ or $2b$
      expect(user?.passwordHash).toHaveLength(60); // Standard bcrypt length
      expect(user?.passwordHash).not.toBe(plainPassword); // Not plaintext

      // Verify bcrypt can validate the password
      const isValid = await bcrypt.compare(plainPassword, user!.passwordHash);
      expect(isValid).toBe(true);

      // Verify wrong password fails
      const isInvalid = await bcrypt.compare('wrongpassword', user!.passwordHash);
      expect(isInvalid).toBe(false);
    });
  });
});

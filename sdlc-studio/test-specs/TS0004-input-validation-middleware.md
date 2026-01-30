# TS0004: Input Validation Middleware Test Specification

> **Story:** [US0004: Input Validation Middleware](../stories/US0004-input-validation-middleware.md)
> **Plan:** [PL0004: Input Validation Middleware Implementation Plan](../plans/PL0004-input-validation-middleware.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Status:** Draft
> **Created:** 2026-01-30
> **Owner:** Richard

---

## Test Strategy

**Approach:** TDD (Test-Driven Development)
**Test Level:** Integration (middleware behavior with Express request/response)
**Framework:** Jest + Supertest
**Test File:** `tests/integration/validation.middleware.test.ts`

---

## Test Suites

### TC001: Required Field Validation

**Purpose:** Verify validateRequired() middleware enforces required fields

**Test Cases:**

#### TC001.1: Missing single required field returns 400
```typescript
it('should return 400 when required field is missing', async () => {
  // Arrange: Request body missing 'email' field
  const body = { username: 'testuser', password: 'password123' };

  // Act: POST with validateRequired(['email', 'username', 'password'])
  const response = await request(app)
    .post('/test/validate-required')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toContain('email');
  expect(response.body.error.details.field).toBe('email');
});
```

#### TC001.2: Multiple missing fields returns error for first missing
```typescript
it('should return 400 for first missing field when multiple are missing', async () => {
  // Arrange: Request body missing both 'email' and 'password'
  const body = { username: 'testuser' };

  // Act: POST with validateRequired(['email', 'username', 'password'])
  const response = await request(app)
    .post('/test/validate-required')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.details.field).toBe('email'); // First in list
});
```

#### TC001.3: All required fields present passes validation
```typescript
it('should call next() when all required fields are present', async () => {
  // Arrange: Request body with all required fields
  const body = { email: 'test@example.com', username: 'testuser', password: 'password123' };

  // Act: POST with validateRequired(['email', 'username', 'password'])
  const response = await request(app)
    .post('/test/validate-required')
    .send(body);

  // Assert: Should reach route handler (returns 200 in test route)
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

#### TC001.4: Empty string treated as missing field
```typescript
it('should return 400 when required field is empty string', async () => {
  // Arrange: Request body with empty string for 'email'
  const body = { email: '', username: 'testuser', password: 'password123' };

  // Act: POST with validateRequired(['email', 'username', 'password'])
  const response = await request(app)
    .post('/test/validate-required')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.details.field).toBe('email');
});
```

#### TC001.5: Whitespace-only string treated as missing field
```typescript
it('should return 400 when required field is whitespace only', async () => {
  // Arrange: Request body with whitespace for 'username'
  const body = { email: 'test@example.com', username: '   ', password: 'password123' };

  // Act: POST with validateRequired(['email', 'username', 'password'])
  const response = await request(app)
    .post('/test/validate-required')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.details.field).toBe('username');
});
```

**Expected Results:** 5/5 tests passing

---

### TC002: Email Format Validation

**Purpose:** Verify validateEmail() middleware validates email format

**Test Cases:**

#### TC002.1: Invalid email without @ symbol returns 400
```typescript
it('should return 400 when email missing @ symbol', async () => {
  // Arrange: Request body with invalid email
  const body = { email: 'notanemail.com' };

  // Act: POST with validateEmail('email')
  const response = await request(app)
    .post('/test/validate-email')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toContain('email');
  expect(response.body.error.details.field).toBe('email');
});
```

#### TC002.2: Invalid email without domain returns 400
```typescript
it('should return 400 when email missing domain', async () => {
  // Arrange: Request body with email missing domain
  const body = { email: 'test@' };

  // Act: POST with validateEmail('email')
  const response = await request(app)
    .post('/test/validate-email')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.message).toContain('Invalid email format');
});
```

#### TC002.3: Valid email passes validation
```typescript
it('should call next() when email is valid', async () => {
  // Arrange: Request body with valid email
  const body = { email: 'test@example.com' };

  // Act: POST with validateEmail('email')
  const response = await request(app)
    .post('/test/validate-email')
    .send(body);

  // Assert: Should reach route handler
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

#### TC002.4: Email with uppercase letters is accepted
```typescript
it('should accept email with uppercase letters', async () => {
  // Arrange: Request body with uppercase email
  const body = { email: 'Test@Example.COM' };

  // Act: POST with validateEmail('email')
  const response = await request(app)
    .post('/test/validate-email')
    .send(body);

  // Assert: Format validation only, case doesn't matter
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

**Expected Results:** 4/4 tests passing

---

### TC003: Length Constraints Validation

**Purpose:** Verify validateLength() middleware enforces min/max length

**Test Cases:**

#### TC003.1: Value below minimum length returns 400
```typescript
it('should return 400 when value is below minimum length', async () => {
  // Arrange: Request body with username too short (2 chars, min 3)
  const body = { username: 'ab' };

  // Act: POST with validateLength('username', 3, 30)
  const response = await request(app)
    .post('/test/validate-length')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toContain('3');
  expect(response.body.error.details.field).toBe('username');
});
```

#### TC003.2: Value above maximum length returns 400
```typescript
it('should return 400 when value is above maximum length', async () => {
  // Arrange: Request body with username too long (31 chars, max 30)
  const body = { username: 'a'.repeat(31) };

  // Act: POST with validateLength('username', 3, 30)
  const response = await request(app)
    .post('/test/validate-length')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.message).toContain('30');
});
```

#### TC003.3: Value within bounds passes validation
```typescript
it('should call next() when value is within min/max bounds', async () => {
  // Arrange: Request body with valid username length
  const body = { username: 'validuser' }; // 9 chars, within 3-30

  // Act: POST with validateLength('username', 3, 30)
  const response = await request(app)
    .post('/test/validate-length')
    .send(body);

  // Assert
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

#### TC003.4: Boundary values (min and max) are accepted
```typescript
it('should accept values exactly at min and max boundaries', async () => {
  // Arrange: Test min boundary (3 chars)
  const minBody = { username: 'abc' };
  const maxBody = { username: 'a'.repeat(30) };

  // Act & Assert: Min boundary
  const minResponse = await request(app)
    .post('/test/validate-length')
    .send(minBody);
  expect(minResponse.status).toBe(200);

  // Act & Assert: Max boundary
  const maxResponse = await request(app)
    .post('/test/validate-length')
    .send(maxBody);
  expect(maxResponse.status).toBe(200);
});
```

**Expected Results:** 4/4 tests passing

---

### TC004: Username Pattern Validation

**Purpose:** Verify validateUsername() middleware enforces alphanumeric + underscore pattern

**Test Cases:**

#### TC004.1: Username with special characters returns 400
```typescript
it('should return 400 when username contains special characters', async () => {
  // Arrange: Request body with username containing @, #
  const body = { username: 'user@name#' };

  // Act: POST with validateUsername('username')
  const response = await request(app)
    .post('/test/validate-username')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toContain('alphanumeric');
  expect(response.body.error.details.field).toBe('username');
});
```

#### TC004.2: Username too short returns 400
```typescript
it('should return 400 when username is too short', async () => {
  // Arrange: Request body with 2-char username (min 3)
  const body = { username: 'ab' };

  // Act: POST with validateUsername('username')
  const response = await request(app)
    .post('/test/validate-username')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.message).toContain('3');
});
```

#### TC004.3: Username too long returns 400
```typescript
it('should return 400 when username is too long', async () => {
  // Arrange: Request body with 31-char username (max 30)
  const body = { username: 'a'.repeat(31) };

  // Act: POST with validateUsername('username')
  const response = await request(app)
    .post('/test/validate-username')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.message).toContain('30');
});
```

#### TC004.4: Valid username (alphanumeric + underscore) passes
```typescript
it('should accept valid username with letters, numbers, underscores', async () => {
  // Arrange: Request body with valid username
  const body = { username: 'user_name_123' };

  // Act: POST with validateUsername('username')
  const response = await request(app)
    .post('/test/validate-username')
    .send(body);

  // Assert
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

**Expected Results:** 4/4 tests passing

---

### TC005: Password Validation

**Purpose:** Verify validatePassword() middleware enforces password strength

**Test Cases:**

#### TC005.1: Password too short returns 400
```typescript
it('should return 400 when password is less than 8 characters', async () => {
  // Arrange: Request body with 7-char password
  const body = { password: 'pass123' }; // 7 chars

  // Act: POST with validatePassword('password')
  const response = await request(app)
    .post('/test/validate-password')
    .send(body);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toContain('8');
  expect(response.body.error.details.field).toBe('password');
});
```

#### TC005.2: Valid password (8+ characters) passes
```typescript
it('should accept password with 8 or more characters', async () => {
  // Arrange: Request body with valid password
  const body = { password: 'password123' }; // 11 chars

  // Act: POST with validatePassword('password')
  const response = await request(app)
    .post('/test/validate-password')
    .send(body);

  // Assert
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

**Expected Results:** 2/2 tests passing

---

### TC006: Middleware Chaining

**Purpose:** Verify multiple validation middleware execute in sequence correctly

**Test Cases:**

#### TC006.1: All validations pass in chain
```typescript
it('should pass through all validation middleware when input is valid', async () => {
  // Arrange: Request body with all valid fields
  const body = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123'
  };

  // Act: POST with full validation chain (required, email, username, password)
  const response = await request(app)
    .post('/test/validate-chain')
    .send(body);

  // Assert: All middleware should call next(), reaching handler
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

#### TC006.2: First validation failure stops chain
```typescript
it('should stop at first validation failure and not execute subsequent middleware', async () => {
  // Arrange: Request body missing required field (fails first middleware)
  const body = {
    username: 'testuser',
    password: 'password123'
    // missing 'email'
  };

  // Act: POST with full validation chain (required → email → username → password)
  const response = await request(app)
    .post('/test/validate-chain')
    .send(body);

  // Assert: Should fail at validateRequired, not reach validateEmail
  expect(response.status).toBe(400);
  expect(response.body.error.details.field).toBe('email');
  expect(response.body.error.details.issue).toContain('Missing required field');
});
```

#### TC006.3: Second validation failure after first passes
```typescript
it('should fail at second middleware when first passes', async () => {
  // Arrange: Request body with all fields (passes required) but invalid email
  const body = {
    email: 'notanemail',  // Invalid format
    username: 'testuser',
    password: 'password123'
  };

  // Act: POST with full validation chain (required → email → username → password)
  const response = await request(app)
    .post('/test/validate-chain')
    .send(body);

  // Assert: Should pass validateRequired but fail at validateEmail
  expect(response.status).toBe(400);
  expect(response.body.error.details.field).toBe('email');
  expect(response.body.error.message).toContain('Invalid email format');
});
```

**Expected Results:** 3/3 tests passing

---

## Test Infrastructure

### Test Routes (for middleware testing)

Create test routes in `tests/integration/validation.middleware.test.ts`:

```typescript
// Test app with validation middleware routes
const testApp = express();
testApp.use(express.json());

// Route for testing validateRequired
testApp.post('/test/validate-required',
  validateRequired(['email', 'username', 'password']),
  (req, res) => res.status(200).json({ success: true })
);

// Route for testing validateEmail
testApp.post('/test/validate-email',
  validateEmail('email'),
  (req, res) => res.status(200).json({ success: true })
);

// Route for testing validateLength
testApp.post('/test/validate-length',
  validateLength('username', 3, 30),
  (req, res) => res.status(200).json({ success: true })
);

// Route for testing validateUsername
testApp.post('/test/validate-username',
  validateUsername('username'),
  (req, res) => res.status(200).json({ success: true })
);

// Route for testing validatePassword
testApp.post('/test/validate-password',
  validatePassword('password'),
  (req, res) => res.status(200).json({ success: true })
);

// Route for testing middleware chaining
testApp.post('/test/validate-chain',
  validateRequired(['email', 'username', 'password']),
  validateEmail('email'),
  validateUsername('username'),
  validatePassword('password'),
  (req, res) => res.status(200).json({ success: true })
);
```

---

## Expected Test Summary

| Test Suite | Test Cases | Expected Pass/Fail |
|------------|------------|-------------------|
| TC001: Required Field Validation | 5 | 5 / 0 |
| TC002: Email Format Validation | 4 | 4 / 0 |
| TC003: Length Constraints | 4 | 4 / 0 |
| TC004: Username Pattern | 4 | 4 / 0 |
| TC005: Password Validation | 2 | 2 / 0 |
| TC006: Middleware Chaining | 3 | 3 / 0 |
| **Total** | **22** | **22 / 0** |

---

## Acceptance Criteria Coverage

| AC | Test Suites | Coverage |
|----|-------------|----------|
| AC1: Required Field Validation | TC001 (5 tests) | ✅ Complete |
| AC2: Email Format Validation | TC002 (4 tests) | ✅ Complete |
| AC3: Length Constraints Validation | TC003 (4 tests) | ✅ Complete |
| AC4: Valid Input Passes Through | TC001.3, TC002.3, TC003.3, TC006.1 | ✅ Complete |

**All acceptance criteria have test coverage.**

---

## Test Execution Plan

1. **Setup:** Create test file with Express test app and validation routes
2. **Implement:** Write all 22 test cases (TDD - these will fail initially)
3. **Run Tests:** Execute `npm test -- validation.middleware.test.ts` → expect 22 failures
4. **Implement Middleware:** Create `src/middleware/validationMiddleware.ts`
5. **Run Tests Again:** Execute tests → expect 22 passes
6. **Verify:** Run full test suite to ensure no regressions

---

## Dependencies

### Required Files
- ✅ `src/utils/validation.ts` - Existing validation utilities
- ⏳ `src/middleware/validationMiddleware.ts` - To be created

### Test Dependencies
- ✅ Jest framework
- ✅ Supertest for HTTP assertions
- ✅ Express for test app

---

## Success Criteria

- [ ] All 22 tests passing
- [ ] 100% code coverage of validationMiddleware.ts
- [ ] All 4 acceptance criteria covered by tests
- [ ] Error response format consistent across all validations
- [ ] Middleware chaining works correctly
- [ ] No regressions in existing test suite

---

## References

- **Story:** [US0004](../stories/US0004-input-validation-middleware.md)
- **Plan:** [PL0004](../plans/PL0004-input-validation-middleware.md)
- **Epic:** [EP0001](../epics/EP0001-user-authentication.md)

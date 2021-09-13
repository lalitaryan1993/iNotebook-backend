const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');
// const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET = 'LalitisagoodB$oy';

// Route 1: Create a new user : POST "/api/auth/createUser". No login required.
router.post(
  '/createUser',
  [
    body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long.'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    let success = false;
    // console.log(req.body);
    // If there are errors, return bad request and errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Check weather the user already exists with the same email address
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        success = false;
        return res.status(400).json({ success, error: 'Sorry a User with this email is already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      let secPass = await bcrypt.hash(req.body.password, salt);
      //   Create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);

      // console.log(authtoken);
      success = true;
      // Return the user
      res.json({ success, authtoken });
      //   .then((user) => res.json(user))
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(400).json({ error: 'Please enter a valid and unique email id ', message: err.message });
      //   });

      //   catch the error
    } catch (error) {
      console.error(error);
      success = false;
      res.status(500).json({ success, error: error.message });
    }
  }
);

// Route 2: Authentication a new user using : POST "/api/auth/login". No login required.

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').exists().withMessage('Password cannot be blank'),
  ],

  async (req, res) => {
    let success = false;
    // If there are errors, return bad request and errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success, error: 'Please try to login with correct credentials.' });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ success, error: 'Please try to login with correct credentials.' });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(payload, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error);
      success = false;
      res.status(500).json({ success, error: 'Internal server error' });
    }
  }
);

// Route 3: Get logged in user details using : POST "/api/auth/getUser".  Login required.
router.post('/getUser', fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json('Internal server error');
  }
});
module.exports = router;

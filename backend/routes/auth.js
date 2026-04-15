const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const sign = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || "changeme_secret",
    { expiresIn: "7d" }
  );

router.post("/register",
  body("name").trim().notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    try {
      const { name, email, password, role } = req.body;
      if (await User.findOne({ email }))
        return res.status(409).json({ message: "Email already registered" });
      const user = await User.create({ name, email, password, role: role === "admin" ? "admin" : "user" });
      res.status(201).json({ token: sign(user), user });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post("/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ message: "Invalid email or password" });
      res.json({ token: sign(user), user });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.get("/me", require("../middleware/auth").authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

module.exports = router;
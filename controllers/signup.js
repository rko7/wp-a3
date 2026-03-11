const express = require('express');
var router = express.Router()
const UsersModel = require('../models/users.js');
const bcrypt = require('bcrypt');

// Display the signup page
router.get("/", async function(req, res)
{
  res.render("signup",
             req.TPL);
});

router.post("/create", async function(req, res)
{
  const username = (req.body.username || "").trim();
  const password = (req.body.password || "").trim();

  if (username.length < 6 || password.length < 6)
  {
    req.TPL.signup_error = "Username and password must be at least 6 characters.";
    res.render("signup",
               req.TPL);
    return;
  }

  const existing = await UsersModel.getUserByUsername(username);
  if (existing)
  {
    req.TPL.signup_error = "Username already exists.";
    res.render("signup",
               req.TPL);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await UsersModel.createUser(username, hashed, "member");

  req.TPL.signup_message = "Account created. You can log in now.";
  res.render("signup",
             req.TPL);
});

module.exports = router;
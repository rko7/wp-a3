const express = require('express');
var router = express.Router()
const UsersModel = require('../models/users.js')
const ArticlesModel = require('../models/articles.js')

// Display the editors page
router.get("/", async function(req, res)
{
  const users = await UsersModel.getAllUsers();
  const articles = await ArticlesModel.getAllArticles();

  req.TPL.users = users;
  req.TPL.articles = articles;

  res.render("editors", req.TPL);
});

module.exports = router;

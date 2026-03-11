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

router.get("/deletearticle/:id", async function(req, res)
{
  await ArticlesModel.deleteArticle(req.params.id);
  res.redirect("/editors");
});

module.exports = router;
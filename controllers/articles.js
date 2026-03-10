const express = require('express');
var router = express.Router()
const ArticlesModel = require('../models/articles.js')

// Display the articles page
router.get("/", async function(req, res)
{
  // Retrieve all of the articles using the model method, display the page
  let results = await ArticlesModel.getAllArticles();
  req.TPL.articles = results;
  res.render("articles",
             req.TPL);

});

module.exports = router;

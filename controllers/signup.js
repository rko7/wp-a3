const express = require('express');
var router = express.Router()

// Display the signup page
router.get("/", async function(req, res)
{
  res.render("signup",
             req.TPL);
});

module.exports = router;
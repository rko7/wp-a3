const express = require('express');
var router = express.Router()

// Display the editors page
router.get("/", async function(req, res)
{
  res.render("editors", req.TPL);
});

module.exports = router;

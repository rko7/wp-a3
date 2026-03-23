const express = require('express');
const app = express();
const session = require('express-session');
const mustacheExpress = require('mustache-express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

// Include the mustache engine to help us render our pages
app.engine("mustache", mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// We use the .urlencoded middleware to process form data in the request body,
// which is something that occurs when we have a POST request.
app.use(express.urlencoded({extended: false}));

// request log to log.txt
app.use(function (req, res, next) {
  const time = new Date().toISOString();
  const reqPath = req.path;
  const ip = req.ip;
  const query = JSON.stringify(req.query || {});
  const body = JSON.stringify(req.body || {});
  const line = `${time},${reqPath},${ip},${query},${body}\n`;

  const logPath = path.join(__dirname, 'log.txt');

  fs.appendFile(logPath, line, function (err) {
    if (err) console.error(err);
    next();
  });
});

// Use the session middleware
app.use(session({secret: 'keyboard cat'
                ,resave: false
                ,saveUninitialized:false}))

// Create a middleware to populate an initial template array
app.use(function(req,res,next) {

  // reset the template obect to a blank object on each request
  req.TPL = {};

  // decide whether to display the login or logout button in the navbar
  req.TPL.displaylogin = !req.session.username
  req.TPL.displaylogout = req.session.username

  next();
});

// Create middlewares for setting up navigational highlighting
// - we could condense this significantly, for example by having one middleware
// that looks at the URL and decides based on a configuration array... but it
// would come at the cost of readability (which matters more right now since
// we are learning middlewares for the first time).
app.use("/home",
        function(req,res,next) { req.TPL.homenav = true; next(); });
app.use("/articles",
        function(req,res,next) { req.TPL.articlesnav = true; next(); });
app.use("/members",
        function(req,res,next) { req.TPL.membersnav = true; next(); });
app.use("/editors",
        function(req,res,next) {
                req.TPL.editorsnav = true;
                if (req.session.level === "editor") next();
                else res.redirect("/home");
        });
app.use("/login",
        function(req,res,next) { req.TPL.loginnav = true; next(); });
app.use("/signup",
        function(req,res,next) { req.TPL.signupnav = true; next(); });

// protect access to the members page, re-direct user to home page if nobody
// is logged in...
app.use("/members", function(req,res,next) {

  if (req.session.username) next();
  else res.redirect("/home");

});

// Include Controllers
//
// - We define all of our routes inside our controllers, and include them in
// our main app script.
//
// - This could present a problem in that we are defining our routes in
// multiple files, and perhaps the same route could be defined in multiple
// controller files.  Some versions of the MVC pattern actually define all
// routes in a separate route file (or multiple route files organized by some
// convention), and the routes reference controller methods.  This approach
// is not better or worse strictly speaking, but it may be best for very
// large/complex applications.
//
// - We define our routes in each controller file.  Each controller file will
// be responsible for the functionality of an individual page of our
// application (this is a common, reasonable way to split things up).  To make
// sure that our controllers do not "step on each other's toes" by using the
// same routes, we will follow a convention that controller routes should be
// as follows: /controller_name[/action_name/url_parameters]
// where the action_name is optional (the root/default method for rendering a
// page), and url_parameters are optional (the action might have parameters or
// not have parameters).
//
// - Note that because we have, app.use("/controllername", ... ) then routes
// defined in the controller files will begin with "/controllername", rather
// then repeating /controllername for each route defined in the file (this
// also makes it easier to change, because it's defined once here).
//
app.use("/home", require("./controllers/home"));
app.use("/articles", require("./controllers/articles"));
app.use("/members", require("./controllers/members"));
app.use("/editors", require("./controllers/editors"));
app.use("/login", require("./controllers/login"));
app.use("/signup", require("./controllers/signup"));

// - We route / to redirect to /home by default
app.get("/", function(req, res) {
  res.redirect("/home");
});

// Catch-all router case
app.get(/^(.+)$/, function(req,res) {
  res.sendFile(__dirname + req.params[0]);
});

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database.db", (err) => {
      if (err) return reject(err);
    });

    db.serialize(function() {
      db.run("CREATE TABLE IF NOT EXISTS Users (username TEXT, password TEXT, level TEXT)");
      db.run("CREATE TABLE IF NOT EXISTS Articles (title TEXT, username TEXT, content TEXT)");

      db.get("SELECT COUNT(*) as c FROM Users", function(err, row) {
        if (err) return reject(err);

        if (row.c === 0) {
          const mem1Hash = bcrypt.hashSync("mem1", 10);
          const mem2Hash = bcrypt.hashSync("mem2", 10);
          const edit1Hash = bcrypt.hashSync("edit1", 10);
          const edit2Hash = bcrypt.hashSync("edit2", 10);

          db.run("INSERT INTO Users VALUES (?,?,?)", ['mem1', mem1Hash, 'member']);
          db.run("INSERT INTO Users VALUES (?,?,?)", ['mem2', mem2Hash, 'editor']);
          db.run("INSERT INTO Users VALUES (?,?,?)", ['edit1', edit1Hash, 'editor']);
          db.run("INSERT INTO Users VALUES (?,?,?)", ['edit2', edit2Hash, 'editor']);
        }

        db.get("SELECT COUNT(*) as c FROM Articles", function(err2, row2) {
          if (err2) return reject(err2);

          if (row2.c === 0) {
            db.run("INSERT INTO Articles VALUES (?,?,?)",
              ["My favourite places to eat",
               "mem1",
               "<p>My favourite places to eat are The Keg, Boston Pizza and" +
               "   McDonalds</p><p>What are your favourite places to eat?</p>"]);

            db.run("INSERT INTO Articles VALUES (?,?,?)",
              ["Tips for NodeJS",
               "mem2",
               "<p>The trick to understanding NodeJS is figuring out how " +
               "async I/O works.</p> <p>Callback functions are also very " +
               "important!</p>"]);

            db.run("INSERT INTO Articles VALUES (?,?,?)",
              ["Ontario's top hotels",
               "edit1",
               "<p>The best hotel in Ontario is the Motel 8 on highway 234</p>" +
               "<p>The next best hotel is The Sheraton off main street.</p>"]);
          }

          db.close(() => resolve());
        });
      });
    });
  });
}

// Start the server
initDatabase().then(() => {
  var server = app.listen(8081, function() {console.log("Server listening...");})
}).catch((err) => {
  console.error(err);
});
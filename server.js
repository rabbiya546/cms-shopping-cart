var express =  require('express');
const fs = require('fs');
const https = require('https');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require ('body-parser');
var session = require ('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
  

// Connect to db
mongoose.connect(config.database, {
  useNewUrlParser: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to mongoDB')
});

//Initailize app 
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));
// Set Global errors variables
//app.locals.errors = null;

// express fileUpload middleware
app.use(fileUpload());
// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

// Express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
})); 
// Express Validator middleware
app.use(expressValidator({
  errorFormatter: function (param, msg, value) {
      var namespace = param.split('.')
              , root = namespace.shift()
              , formParam = root;

      while (namespace.length) {
          formParam += '[' + namespace.shift() + ']';
      }
      return {
          param: formParam,
          msg: msg,
          value: value
      };
  },
  customValidators: {
      isImage: function (value, filename) {
          var extension = (path.extname(filename)).toLowerCase();
          switch (extension) {
              case '.jpg':
                  return '.jpg';
              case '.jpeg':
                  return '.jpeg';
              case '.png':
                  return '.png';
              case '':
                  return '.jpg';
              default:
                  return false;
          }
      }
  }
}));



// Express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Set Routes
var pages = require('./routes/pages.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/', pages);

// Set the Srever
var port = process.env.PORT || 443;

const options = {
    key: fs.readFileSync('./certs/key.pem' ),
    cert: fs.readFileSync('./certs/certificate.pem' ),
    requestCert: false,
    rejectUnauthorized: false
};
  
const server = https.createServer(options, app);
  
server.listen(port, function(){
    console.log('Server started on port ' + port)
});
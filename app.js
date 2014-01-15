/*
* Beacon
* beaconBeta.com
*/
var 
  http    = require('http'),
  connect = require('connect'),
  express = require('express'),
  app     = express(),
  port    = process.env.PORT || 9001,
  server  = app.listen(port),

  io      = require('socket.io').listen(server),
  handler = require('./app/server/socketHandler.js'),
  
  redis   = require('redis'),
  redisStore = require('connect-redis')(express),

  passport = require('passport'), 
  FacebookStrategy = require('passport-facebook').Strategy,
  FacebookTokenStrategy = require('passport-facebook-token').Strategy,  
  passportSocketIo = require("passport.socketio"),
  
  config    = require('./config.json'),
  colors  = require('colors');
require.main.exports.io = io;
// console.log(require.main.exports);
// Create pub/sub channels for sockets using redis. 
var rtg  = require("url").parse(config.DB.REDISTOGO_URL);
var pub = redis.createClient(rtg.port, rtg.hostname);
var sub = redis.createClient(rtg.port, rtg.hostname);
var store = redis.createClient(rtg.port, rtg.hostname);
pub.auth(rtg.auth.split(":")[1], function(err) {if (err) throw err});
sub.auth(rtg.auth.split(":")[1], function(err) {if (err) throw err});
store.auth(rtg.auth.split(":")[1], function(err) {if (err) throw err});

var sessionStore = new redisStore({client: store}); // socket.io sessions


passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done) { done(null, obj); });

var ppOptions = {
  clientID: config.FB.FACEBOOK_APP_ID,
  clientSecret: config.FB.FACEBOOK_APP_SECRET,
  callbackURL: config.HOST+"auth/facebook/callback"
}
function passportSuccess(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    // console.log(profile);
    var sessionData = { 'id':+profile.id, 'name':profile.displayName, 'token':accessToken };
    return done(null, sessionData);
  });
}
passport.use(new FacebookStrategy(ppOptions, passportSuccess));
passport.use(new FacebookTokenStrategy(ppOptions, passportSuccess));

//Middleware: Allows cross-domain requests (CORS)
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

// Configure express app.
app.configure(function() {
  app.use(allowCrossDomain);
  app.set('views', __dirname + '/app/server/views');
  app.set('view engine', 'jade');
  app.locals.pretty = true;
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: config.SECRET.cookieParser, store: sessionStore }));
  app.use(passport.initialize());
  app.use(passport.session());  
  app.use(require('stylus').middleware({ src: __dirname + '/app/client' }));
  app.use(express.static(__dirname + '/app/client'));
  app.use(express.errorHandler());
});


var ioRedisStore = require('socket.io/lib/stores/redis');
// Configure socketio.
io.configure( function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('store', new ioRedisStore({redis: redis, redisPub:pub, redisSub:sub, redisClient:store}));
});

io.set('authorization', passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  key:         'connect.sid',       // the name of the cookie where express/connect stores its session_id
  secret:      config.SECRET.cookieParser,    // the session_secret to parse the cookie
  store:       sessionStore,        // we NEED to use a sessionstore. no memorystore please
}));

// Bind socket handlers. 
io.sockets.on('connection', function(socket) {
  handler.login(socket);
  socket.on('joinBeacon',   function(data){ handler.joinBeacon  (data, socket) });
  socket.on('deleteBeacon', function(data){ handler.deleteBeacon(data, socket) });
  socket.on('leaveBeacon',  function(data){ handler.leaveBeacon (data, socket) });
  socket.on('newBeacon',    function(data){ handler.newBeacon   (data, socket) });
  socket.on('newComment',   function(data){ handler.newComment  (data, socket) });
  socket.on('moveBeacon',   function(data){ handler.moveBeacon  (data, socket) });
  socket.on('updateGroup',  function(data){ handler.updateGroup (data, socket) });
  socket.on('updateBeacon', function(data){ handler.updateBeacon(data, socket) });
  socket.on('followBeacon', function(data){ handler.followBeacon(data, socket) });
  socket.on('getFriendsList',function(data){ handler.getFriendsList(socket) });
  socket.on('disconnect',   function(){ handler.disconnect(socket) });
});
// open to io scope for other modules to use;

// exports.io = io;
// Route all routes. 
require('./app/server/router')(app, passport);
                  
var domo =  ''+
"#####################################\n"+
'DOMOS HOSTS THE BEACON INTO THE CLOUD \n'+
'╲╲╭━━━━╮╲╲╲╲╭━━━━╮╲╲╲╲╭━━━━╮╲╲\n'+
'╭╮┃▆┈┈▆┃╭╮╭╮┃▆┈┈▆┃╭╮╭╮┃▆┈┈▆┃╭╮\n'+
'┃╰┫▽▽▽▽┣╯┃┃╰┫▽▽▽▽┣╯┃┃╰┫▽▽▽▽┣╯┃\n'+
'╰━┫△△△△┣━╯╰━┫△△△△┣━╯╰━┫△△△△┣━╯\n'+
'╲╲┃┈┈┈┈┃╲╲╲╲┃┈┈┈┈┃╲╲╲╲┃┈┈┈┈┃╲╲\n'+
'╲╲┃┈┏┓┈┃╲╲╲╲┃┈┏┓┈┃╲╲╲╲┃┈┏┓┈┃╲╲\n'+
'▔▔╰━╯╰━╯▔▔▔▔╰━╯╰━╯▔▔▔▔╰━╯╰━╯▔▔\n'+
'#####################################';
console.log(domo.rainbow);
console.log('Port:', (''+port).bold);


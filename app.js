const express = require('express')
, user = require('./routes/user.js')
, http = require('http')
, path = require('path');
const keys = require('./keys.js');
const session = require('express-session');
const uuid=require('uuid').v4
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcrypt-nodejs');
const app = express();
const mysql  = require('mysql');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodeGeocoder = require('node-geocoder');
let options = {
    provider: 'openstreetmap'
  };
   
let geoCoder = nodeGeocoder(options);

var con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"bharatH?718",
    database:"Bbank",
    insecureAuth:true
   
});
con.connect(function(err){
    if(!err) {
        console.log("Database is connected ... nn");
    } else {
        console.log("Error connecting database ... nn");
    }
});
 
global.db = con;
global.bcrypt=bcrypt;
global.mysql=mysql;

// Google authentication for user
passport.use(
    new GoogleStrategy(
      {
        clientID:keys.clientId,
        clientSecret:keys.clientSecret,
        callbackURL: "/auth/google/redirect"
       // accessType: "offline",
       // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
      },
      (accessToken, refreshToken, profile, done) => {
        console.log('passport callback function');
        console.log(profile.emails[0].value);
        db.query("SELECT * FROM USER where email="+mysql.escape(profile.emails[0].value)+";",(err,result,fields)=>{
            if(err){
                console.log(err);
                return done(null,false);
            }
            if(result.length==0){
               console.log("User doesn't exist");
                return done(null,false);
            }
            else{
               return  done(null,result[0]);
            }
        });
    }
    )
);

//local strategy for user
passport.use('user',new LocalStrategy(
    { usernameField: 'id' },
    (id, password, done) => {
      console.log('Inside local strategy callback')
        db.query("SELECT * FROM USER where UserID="+mysql.escape(id)+";",(err,result,fields)=>{
        console.log(result);
        if(err){
            console.log(err);
            return done(null, false, { message: "Password error" });
        }
        if(result.length==0){
            console.log("User doesn't exist");
            return done(null, false, { message: "User doesn't exist" });
        }
        var found=0;
        var user;
        bcrypt.compare(password,result[0].password, function(err, ress){
            if(ress===true){
                console.log("Login success");
                found=1;
                user=result[0];
            }
            if(found==1){
                console.log('Local strategy returned true')
                return done(null, user)
            }
            else{
                console.log('Wrong password')
                return done(null,false,{message:"Wrong password"});
          
            }   
       })
       })
    }
));

//local strategy for Bbank
passport.use('bbank',new LocalStrategy(
    { usernameField: 'id' },
    (id, password, done) => {
      console.log('Inside local strategy callback')
        db.query("SELECT * FROM blood_bank where BloodBankID="+mysql.escape(id)+";",(err,result,fields)=>{
        console.log(result);
        if(err){
            console.log(err);
            res.end(err['sqlMessage']);
        }
        if(result.length==0){
            console.log("Bank doesn't exist");
            return done(null, false, { message: "Bank doesn't exist" });
        }
        var found=0;
        var bank;
        bcrypt.compare(password,result[0].password, function(err, ress){
            if(ress===true){
                console.log("Login sucess");
                found=1;
                bank=result[0];
            }
            if(found==1){
                console.log('Local strategy returned true')
                return done(null, bank)
            }
            else{
                console.log('Wrong password')
                message = 'You have entered invalid  password.';
                return done(null, false, { message: "Wrong password" });
                //res.render('index.ejs',{message: message});
                //reload the form page
             }   
       })
       })
    }
));

// tell passport how to serialize the user and bbank
passport.serializeUser((obj, done) => {
    if(Object.keys(obj).length==9){
        console.log('Inside serializeUser callback. User id is save to the session file store here');
        var a_id='a'+obj.UserID;//to diff user
        console.log(a_id);
        done(null,a_id);
    }
    else{
        console.log('Inside serializeUser callback. Bbank id is save to the session file store here');
        var b_id='b'+obj.UserID;//to diff bank
        console.log(b_id);
        done(null,b_id);
    }
});
//tell passport how to deserialize the user and bbank
passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log("The user id passport saved in the session file store is: ${id}")
    var l_id=id.toString();
    console.log(l_id.charAt(0));
    if(l_id.charAt(0)=='a'){
        console.log("user"+l_id.substr(1));
        db.query("SELECT * FROM User where UserID="+mysql.escape(l_id.substr(1))+";",(err,result,fiels)=>{
            console.log(result);
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            const obj=result[0];
            done(null,obj);
        })
    }
    else{
        console.log("bank"+l_id.substr(1));
        db.query("SELECT * FROM blood_bank where BloodbankID="+mysql.escape(l_id.substr(1))+";",(err,result,fiels)=>{
            console.log(result);
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            const obj=result[0];
            done(null,obj);
        })
    }
});

//app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
//session
app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionID)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'dbmsproj',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());



var message='';

//basic endpoints
app.get('/', function(req, res) {
    console.log("Home page"); 
   console.log("Session id is",req.sessionID);
    res.render('home');
});
app.get('/user', (req, res) => {
    console.log("user Session id is",req.sessionID);
    res.render('user');
});
app.get('/msg',(req,res)=>{
   res.render('msg');
});

//google auth endpoints
app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/redirect",passport.authenticate("google",{ failureRedirect: '/login' }),(req,res)=>{
    if(!req.user){
        console.log("error");
        res.redirect("/signup");
    }
    else{
     //   res.send(req.user);
        return res.redirect("/profile");
    }
});

//user
app.get('/usignup', user.signup);
app.post('/usignup', user.signup);
app.get('/ulogin', user.login);
app.post('/ulogin', user.login);
app.get('/profile', user.dashboard);
app.get('/health_history',user.history);
app.get('/logout', user.logout);

app.get('/udonate',user.donate);
app.post('/udonate',user.donate);
app.get('/urequest',user.request);
app.post('/urequest',user.request);
app.get('/uavailable/:id',user.available);
app.get('/display_uavailable',user.avail_form);
app.get('/blood_camp.html',user.campavail);


//Bbank
/*app.get('/bsignup', user.bsignup);
app.post('/bsignup', user.bsignup);
app.get('/blogin', user.blogin);
app.post('/blogin', user.blogin);
*/
app.listen(3000,()=>{
    console.log('app is listening on port 3000');
});



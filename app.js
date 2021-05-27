const express = require('express')
/*routes = require('./routes')*/
, user = require('./routes/user.js')
, http = require('http')
, path = require('path');
//const flash = require('express-flash')
//const bodyParser = require('body-parser');
const session = require('express-session');
const uuid=require('uuid').v4
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcrypt-nodejs');
const app = express();
const mysql  = require('mysql');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy


//app.use(flash())

var con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Harish$30",
    database:"blood_bank_system",
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

// configure passport.js to use the local strategy
passport.use('user',new LocalStrategy(
    { usernameField: 'id' },
    (id, password, done) => {
      console.log('Inside local strategy callback')
        db.query("SELECT * FROM USER where UserID="+mysql.escape(id)+";",(err,result,fields)=>{
        console.log(result);
        if(err){
            console.log(err);
            res.end(err['sqlMessage']);
        }
        if(result==={}){
            //res.send("User doesn't exist");
        }
        var found=0;
        var user;
        bcrypt.compare(password,result[0].password, function(err, ress){
            if(ress===true){
                console.log("Login sucess");
                found=1;
                user=result[0];
            }
        console.log(found);
        console.log("hello");
        if(found==1){
            console.log('Local strategy returned true')
            return done(null, user)
        }
        else{
           console.log('Wrong password')
           message = 'You have entered invalid  password.';
           //res.render('index.ejs',{message: message});
           //reload the form page
       }   
       })
       })
   
    }
));
/*passport.use('bbank',new LocalStrategy(
    { usernameField: 'id' },
    (id, password, done) => {
      console.log('Inside local strategy callback')
        db.query("SELECT * FROM blood_bank where BloodBankID="+mysql.escape(id)+";",(err,result,fields)=>{
        console.log(result);
        if(err){
            console.log(err);
            res.end(err['sqlMessage']);
        }
        if(result==={}){
            res.send("Bank doesn't exist");
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
            res.render('index.ejs',{message: message});
            //reload the form page
             }   
       })
       })
    }
));*/

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    if(Object.keys(user).length==8){
        console.log('Inside serializeUser callback. User id is save to the session file store here');
        console.log(user.UserID);
        done(null, user.UserID);
    }
});
passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    db.query("SELECT * FROM User where UserID="+mysql.escape(id)+";",(err,result,fiels)=>{
        console.log(result);
        if(err){
            console.log(err);
            res.end(err['sqlMessage']);
        }
        const user=result[0];
        done(null,user);
    })
});

//app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
//app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionID)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore({logFn: function(){}}),
    secret: 'dbmsproj',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());



var message='';

app.get('/', function(req, res) {
    console.log("Home page");
    
  console.log("Session id is",req.sessionID);
    //res.send(req.sessionID);
    res.render('home');
});
app.get('/user', (req, res) => {
    console.log("user Session id is",req.sessionID);
    res.render('user');
});
app.get('/msg',(req,res)=>{
   res.render('msg');
});
 
/*app.get('/', routes.index);*/
app.get('/signup', user.signup);
app.post('/signup', user.signup);
app.get('/login', user.login_get);
app.post('/login', user.login);

app.get('/udonate',user.donate);
app.post('/udonate',user.donate);
app.get('/urequest',user.request);
app.post('/urequest',user.request);
app.get('/profile', user.dashboard);
app.get('/logout', user.logout);


app.get('/uavailable/:id',user.available);
app.get('/campavail/:id',user.campavail);


//Bbank
app.get('/bsignup', user.bsignup);
app.post('/bsignup', user.bsignup);
app.get('/blogin', user.blogin);
app.post('/blogin', user.blogin);
app.listen(8080,()=>{
    console.log('app is listening on port 8080');
});





//res=this is working
//login -->POST  sucess/fail
//request -->POST  request obj created
//donate -->POST  
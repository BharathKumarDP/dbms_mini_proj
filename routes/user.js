const passport = require('passport');
//const LocalStrategy = require('passport-local').Strategy
exports.signup=function(req,res){
    var message='';
    if(req.method=="POST"){
        const {name,age,state,city,address,password,ht,wt,bp,sugar,ailments,type}=req.body;
        db.query("SELECT MAX(UserID) as uid FROM USER;",(err,result,fields)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            const id=Number(result[0].uid)+1;
            console.log(id,"created");
            let hash_v;
            let pts=0;
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt, null, function(err, hash) {
                    hash_v=hash;
                    console.log(hash_v);
                    db.query("INSERT INTO user Values ("+mysql.escape(id)+","+mysql.escape(hash_v)+","+mysql.escape(name)+","+mysql.escape(age)+","+mysql.escape(state)+","+mysql.escape(city)+","+mysql.escape(address)+ "," +mysql.escape(pts)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                        message = "Your account has been created succesfully.";
			           res.render('msg.ejs',{message:message,id:id});
                    });
                    
                    db.query("INSERT INTO health_history Values("+mysql.escape(id)+","+mysql.escape(type)+","+mysql.escape(sugar)+","+mysql.escape(bp)+","+mysql.escape(ht)+","+mysql.escape(wt)+","+mysql.escape(ailments)+",NULL);",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                       console.log('User'+id+'health history created ');
                    });
                });
            });
        });
    }
    else{
        res.render('signup',{message:message});
    }       
};


exports.login_get=function(req,res){
    if (req.method == "GET"){
        console.log('Inside GET /login callback')
        console.log(req.sessionID)
        //res.send(`You got the login page!\n`)
        res.render('index.ejs',{message:''});
    }
};

exports.login=function(req,res,next){
    var message='';     
    console.log(req.body.id);
    console.log(req.body.password);
//res.send('You were authenticated & logged in!\n');
    passport.authenticate('user', (err, user, info) => {
        console.log('Inside passport.authenticate() callback');
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        req.login(user, (err) => {
          console.log('Inside req.login() callback')
          console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
          console.log(`req.user: ${JSON.stringify(req.user)}`)
            res.redirect('/profile');
            return;
        })
      })(req, res, next);
    // res.redirect('/profile');
    
    };



exports.dashboard=function(req,res){
        if(req.isAuthenticated()){
        const id=req.user.UserID;
        console.log("YEAHHHHH",id);
        res.send('you hit the authentication endpoint\n');
     
        res.render('user_dashboard.ejs');
        }
      else {
          console.log("Eroor\n");
        res.redirect('/login');
        return;
      }


}; 

exports.donate=function(req,res){
    var id;
    var found=0;
    if(req.method=="POST"){
        if(req.isAuthenticated()) {
            const id=req.user.UserID;
            found=1;
            console.log('Donated id is',id);
           // res.send('you hit the authentication endpoint\n');
            
        }
        else {
        res.redirect('/login',{message:''});
        return;
        }
        if(found==1){
                var messgae='';
                const {date,bname}=req.body;
                console.log(bname);
                console.log(typeof(bname));
                db.query("SELECT MAX(DonationID) as did FROM donations;",(err,result,fields)=>{
                if(err){
                    console.log(err);
                    res.end(err['sqlMessage']);
                }
                let did=result[0].did+1;
                //console.log(did,"created");
                db.query("SELECT BloodBankID FROM blood_bank WHERE Name="+mysql.escape(bname)+";",(err,result,fields)=>{
                    let bbid=result[0].BloodBankID;
                    let status="Pending";
                    let uid=req.user.UserID;
                    console.log(bbid);
                    db.query("INSERT INTO donations Values("+mysql.escape(did)+","+mysql.escape(uid)+","+mysql.escape(bbid)+","+mysql.escape(date)+","+mysql.escape(status)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                    
                    message="Donation request submitted";
                    
                    //res.render('blood_donor.ejs',{message:message,id:''});
                    res.redirect('/profile');
                        //res.end("Success");
                        //alert blood bank,increment donation counts
                        //trigger to increment points
                    });

                });
            });
        }
    }
    else{
        var {id}=req.user.UserID;
        console.log("id=",id);
        var message='';
        res.render('blood_donor.ejs',{id:id,message:message});
    }
    
};

exports.request=function(req,res){
    var id;
    var found=0;
    if(req.method=="POST"){
        if(req.isAuthenticated()) {
            res.send('you hit the authentication endpoint\n');
            const id=req.user.UserID;
            found=1;
        //res.render('user_dashboard.ejs',{id:id});
        } else {
            res.redirect('/login'),{message:''};
            return;
        }
        if(found==1){
            const {type,comp,units,area,name}=req.body;
            db.query("SELECT BloodbankID as bid FROM blood_bank WHERE NAME="+mysql.escape(name)+";",(err,result,fields)=>{
                var bbid=result[0].bid;
                var status="Pending";
                var uid=req.params.id;
                var reqid;
                var date_time;
                db.query("SELECT MAX(requestID) as reqID from REQUESTS",(err,result,fields)=>{
                    if(result==={}){
                        reqid=1;
                    }
                    reqid=result[0].reqID+1;
                    db.query("SELECT NOW() as dt;",(err,result,fields)=>{
                        date_time=result[0].dt;
                        console.log(date_time);
                    })
                    console.log(date_time);
                    db.query("INSERT INTO REQUESTS Values("+mysql.escape(reqid)+","+mysql.escape(uid)+","+mysql.escape(bbid)+","+mysql.escape(type)+","+mysql.escape(comp)+","+mysql.escape(status)+","+mysql.escape(area)+","+mysql.escape(date_time)+","+mysql.escape(units)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                        console.log("Blood request submitted");
                        res.send("Success");
                        //alert blood bank,increment req counts(trigger)
                    });

                });
            });
        }
    }
    else{
        var {id}=req.user.UserID;
        console.log("id=",id);
        var message='';
        res.render('blood_request.ejs',{id:id,message:message});
    }  
};



 exports.available=function(req,res){
    if(req.method=="GET"){
       
    let type=req.query.bloodtype;
    let comp=req.query.bloodcomp;
    let state=req.query.state;
    let city=req.query.city;
    console.log(type);
    console.log(comp);
    console.log(state);

   
        db.query("SELECT U_AVAIL("+mysql.escape(city)+","+mysql.escape(state)+","+mysql.escape(type)+","+mysql.escape(comp)+") as avail;",(err,result,fields)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            console.log("Blood details shown");
            //res.send(JSON.parse(result[0].avail));
            res.render('disp.ejs',{data:JSON.parse(result[0].avail)});
        });
    }
    else{
        res.render('blood_stock.ejs');
    }

     
    
};
exports.campavail=function(req,res){
    if(req.method=="GET"){
    let uid=req.params.id;
    
        db.query("SELECT city,state FROM USER WHERE Userid="+mysql.escape(uid)+";",(err,result,fields)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            console.log(result[0].state);
            city=result[0].city;
            state=result[0].state;
            db.query("SELECT *  FROM CAMPS WHERE City="+mysql.escape(city)+"AND State="+mysql.escape(state)+";",(err,resu,fields)=>{
                if(err){
                    console.log(err);
                    res.end(err['sqlMessage']);
                }
                //display camps
                console.log(resu);
                res.send(resu);
            });
        });
        //display all camps with an option
    }
    else{
        res.render('blood_camp.ejs');
    }


};

exports.logout=function(req,res){
    req.session.destroy(function(err) {
       return res.redirect('/login');
    })
 };


//BLOODBANK


exports.bsignup=function(req,res){
    var message='';
    if(req.method=="POST"){
    const {name,password,license,state,city,cat,contact,address,website}=req.body;
    
    var hash_v;
    
        //let pts=0;
        let id;
       // var hash_v;
        db.query("SELECT MAX(BloodBankID) as bbid FROM blood_bank;",(err,result,fields)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            id=result[0].bbid+1;
            console.log(id,"created");
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, null, null, function(err, hash) {
                        hash_v=hash;
            
                    db.query("INSERT INTO blood_bank Values ("+mysql.escape(id)+","+mysql.escape(hash_v)+","+mysql.escape(name)+","+mysql.escape(cat)+","+mysql.escape(address)+","+mysql.escape(contact)+","+mysql.escape(license)+","+mysql.escape(website)+","+mysql.escape(state)+","+mysql.escape(city)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                        message = "Your account has been created succesfully.";
			           res.render('bmsg.ejs',{message: message});
                        //res.end(1);
                    });
                });
            });
        });
    }
        else{
            res.render('bsignup.ejs',{message:message});
        }
    
};
exports.blogin=function(req,res){
    var message='';
    var sess=req.session;
    if(req.method=="POST"){
    const {name,password}=req.body;
    var sql="SELECT BloodBankID, password FROM `blood_bank` WHERE `Name`='"+name+"'"; 
        db.query(sql,(err,result,fields)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            if(result.length){
            var found=0;
            var hash_v;
            console.log(result[0].password);
            bcrypt.compare(password,result[0].password, function(err, resu){
               // console.log(hash_v);
                if(resu===true){
                   // console.log(resu[0].password);
                    console.log("Login sucess");
                    found=1;
                }
                //res.end("Login Success");
                if(found==1){
                   // res.end("Login Sucesss");
                   req.session.bId = result[0].BloodBankID;
                    var id=req.session.bId;
                    req.session.buser = result[0];
                   res.redirect(`/bprofile/${id}`);
                   return;
                    //route to url /:id/bprofile
                }
                else{
                    message = 'You have entered invalid  password.';
                    res.render('blogin.ejs',{message: message});
                }
            });
        }
        else{
            message = 'You have entered invalid username or password.';
           res.render('blogin.ejs',{message: message});
           }
         });
    
    
  }
  else{
    res.render('blogin.ejs',{message: message});
  }
};

exports.bdashboard=function(req,res){
    if(req.session.bId){
    console.log(req.session.bId);
    const {id}=req.params;

    res.render('bbank_dashboard.ejs',{id:id});
    }
    else{
       res.render('msg2.ejs');
    }
}; 
exports.campreq=function(req,res){
    
    if(req.method=="POST"){
         const {city,state,date}=req.body;
  
        db.query("SELECT MAX(CampID) as cid from CAMPS",(err,result,field)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            var cid,bid;
            if(!result.length){
                cid=1;
            }
            cid=result[0].cid+1;
            bid=req.params.id;
            status="Pending";
            db.query("INSERT INTO CAMPS VALUES("+mysql.escape(cid)+","+mysql.escape(bid)+","+mysql.escape(date)+","+mysql.escape(status)+","+mysql.escape(city)+","+mysql.escape(state)+");",(err,result,fields)=>{
                if(err){
                    console.log(err);
                    res.end(err['sqlMessage']);
                }
                message = "Camp registered";
                res.render('msg.ejs',{message: message});


            });
        });
    }
  else{
        res.render("campreq");
   }
};

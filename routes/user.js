const passport = require('passport');

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
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt, null, function(err, hash) {
                    hash_v=hash;
                    console.log(hash_v);
                    db.query("INSERT INTO user Values ("+mysql.escape(id)+","+mysql.escape(hash_v)+","+mysql.escape(name)+","+mysql.escape(age)+","+mysql.escape(state)+","+mysql.escape(city)+","+mysql.escape(address)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                        message = "Your account has been created succesfully.";
			           res.render('msg.ejs',{message: message});
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
        res.render('usignup',{message:message});
    }       
};


exports.login=function(req,res,next){
    if(req.method=="POST"){
    var message='';     
    passport.authenticate('user', (err, user, info) => {
        req.login(user, (err) => {
          if(req.user){
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            res.redirect('/profile');
          }
          else{
                message = 'You have entered invalid  password.';
                res.render('index.ejs',{message: message});
                res.redirect('/ulogin',{message:message});
          }
        })
      })(req, res, next);
    }
    else{
        console.log('Inside GET /login callback')
        console.log(req.sessionID)
        res.send(`You got the login page!\n`)
        res.render('index.ejs',{message:''});
    }
};

exports.dashboard=function(req,res){
    if(req.isAuthenticated()) {
        const id=req.user.UserID;
        console.log(id);
        res.render('user_dashboard.ejs',{id:id});
      } 
      else {
        res.redirect('/ulogin',{message:''});
      }
}; 


exports.history=function(req,res){
    if(req.isAuthenticated()) {
        const id=req.user.UserID;
        console.log(id);
        var obj;
        db.query("SELECT * from health_history where UserID="+mysql.escape(id)+";",(err,result,field)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            if(result.length==0){
                res.send("User doesn't exist");
            }
            obj=result[0];
            console.log(obj);
        })
        db.query("SELECT pts as pt from User where UserID="+mysql.escape(id)+";",(err,result,field)=>{
            if(err){
                console.log(err);
                res.end(err['sqlMessage']);
            }
            if(result.length==0){
                res.send("User doesn't exist");
            }
            obj["points"]=result[0].pt
            console.log(obj);
            res.send(obj);
        })
      } 
      else {
         res.redirect('/ulogin',{message:''});
      }

}

exports.donate=function(req,res){
    var id;
    var found=0;
    if(req.method=="POST"){
        if(req.isAuthenticated()) {
            res.send('you hit the authentication endpoint\n');
            const id=req.user.UserID;
            found=1;
        }
        else {
            res.redirect('/ulogin',{message:''});
        }
        if(found==1){
                var messgae='';
                var {date,bname}=req.body;
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
                    let bbid=result[0].BloodbankID;
                    let status="Pending";
                    let uid=req.params.id;
                    //console.log(uid);
                    db.query("INSERT INTO donations Values("+mysql.escape(did)+","+mysql.escape(uid)+","+mysql.escape(bbid)+","+mysql.escape(date)+","+mysql.escape(status)+");",(err,result,fields)=>{
                        if(err){
                            console.log(err);
                            res.end(err['sqlMessage']);
                        }
                        message="Donation request submitted";
                        res.redirect("/profile",{message:message});
                        //res.end("Success");
                        //alert blood bank,increment donation counts
                        //trigger to increment points
                    });

                });
            });
        }
    }
    else{
        if(found==1){
            var {id}=req.user.UserID;
            console.log("id=",id);
            var message='';
            res.render('blood_donor.ejs',{id:id,message:message});
        }
    }    
};

exports.request=function(req,res){
    var id;
    var found=0;
    if(req.isAuthenticated()) {
        console.log('you hit the authentication endpoint\n');
        const id=req.user.UserID;
        found=1;
    } else {
        res.redirect('/ulogin',{message:''});
    }
    if(req.method=="POST"){
        if(found==1){
            const {type,comp,units,area,name}=req.body;
            db.query("SELECT BloodbankID as bid FROM blood_bank WHERE NAME="+mysql.escape(name)+";",(err,result,fields)=>{
                var bbid=result[0].bid;
                var status="Pending";
                var uid=req.params.id;
                var reqid;
                db.query("SELECT MAX(requestID) as reqID from REQUESTS",(err,result,fields)=>{
                    if(result==={}){
                        reqid=1;
                    }
                    reqid=result[0].reqID+1;
                    db.query("INSERT INTO REQUESTS Values("+mysql.escape(reqid)+","+mysql.escape(uid)+","+mysql.escape(bbid)+","+mysql.escape(type)+","+mysql.escape(comp)+","+mysql.escape(status)+","+mysql.escape(area)+",NOW(),"+mysql.escape(units)+");",(err,result,fields)=>{
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
        if(found==1){
            var {id}=req.user.UserID;
            console.log("id=",id);
            var message='';
            res.render('blood_request.ejs',{id:id,message:message});
        }
    }  
};

exports.available=function(req,res){
    var found=0;
    if(req.isAuthenticated()) {
        console.log('you hit the authentication endpoint\n');
        const id=req.user.UserID;
        found=1;
    } else {
        res.redirect('/ulogin',{message:''});
    }
    if(req.method=="GET"){ 
        if(found==1){        
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
    }
    else{
        res.render('blood_stock.ejs');
    }
};

exports.campavail=function(req,res){
    var found=0;
    if(req.isAuthenticated()) {
        console.log('you hit the authentication endpoint\n');
        const id=req.user.UserID;
        found=1;
    } else {
        res.redirect('/ulogin',{message:''});
    }
    if(req.method=="GET"){
        if(found==1){
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
        }
        //display all camps with an option
    }
    else{
        res.render('blood_camp.ejs');
    }
};

exports.logout=function(req,res){
    var found=0;
    if(req.isAuthenticated()) {
        console.log('you hit the authentication endpoint\n');
        const id=req.user.UserID;
        found=1;
    } else {
        res.redirect('/ulogin',{message:''});
    }
    if(req.method=="GET"){
        if(found==1){
            req.session.destroy(function(err) {
            return res.redirect('/login',{message:''});
            })  
        }
        else{
            res.redirect('/login',{message:''});
        }
    }
 };
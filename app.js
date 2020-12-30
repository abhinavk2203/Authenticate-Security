

require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");          //encrypt method
// const md5 = require("md5");                              //md5 method
// const bcrypt = require("bcrypt");                        //bcrypt method
// const saltRounds = 10;
const session = require('express-session')                  //lev 5: using cookies and session via Passport
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");




const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(BodyParser.urlencoded({extended: true}));


app.use(session({                                   //setting up the session
    secret: "This is our litte secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({            //Schema for DB
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);       //this will plugin passLocalMongoose to the User schema


const User = mongoose.model("User", userSchema);        //model based on Schema

passport.use(User.createStrategy());                    //to create a local login strategy
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();                       //passport method of logout
    res.redirect("/");
});




app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });



    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {     //bcrypt method
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    
    //     newUser.save(function(err){
    //         if(err){
    //             res.send(err);
    //         }else{
    //             res.render("secrets");
    //         }
    //     });        
    // });



});

app.post("/login", function(req, res){              //now with this route we can check if the user is present in our DB

    const user = new User({
        username: req.body.username,
        password: req.body.password

    });

    req.login(user, function(err){                  //passport method of login
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });



    // const username = req.body.username;                      //bcrypt method
    // const password = req.body.password;

    // User.findOne({email: username}, function(err, foundUser){
    //     if(err){
    //         res.send("Username not found, kindly do register");
    //     }else{
    //         if(foundUser){
    //             bcrypt.compare(password, foundUser.password, function(err, result) {

    //                 if(result === true){
    //                     res.render("secrets");
    //                 }else{
    //                     res.send("Incorrect password, Login again!");
    //                 }
    //             });
                
    //         }
    //     }
    // });
});



app.listen(3000, function(){
    console.log("Server successfully started on port 3000");
});
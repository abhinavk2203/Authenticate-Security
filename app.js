

require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");          //encrypt method
// const md5 = require("md5");                              //md5 method
// const bcrypt = require("bcrypt");                        //bcrypt method
// const saltRounds = 10;
const session = require("express-session")                  //lev 5: using cookies and session via Passport
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;         //adding google OAuth 2.0
const findOrCreate = require("mongoose-findorcreate");                      //module for finding and creating and then saving the data (shortcut)




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
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);       //this will plugin passLocalMongoose to the User schema
userSchema.plugin(findOrCreate);                //adding findorCreate plugin on the schema


const User = mongoose.model("User", userSchema);        //model based on Schema

passport.use(User.createStrategy());                    //to create a local login strategy
 
// passport.serializeUser(User.serializeUser());        //the serialisation and deserialisation works locally
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {           //by using this passport method serialisation and deserialisation can work on any level
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});



passport.use(new GoogleStrategy({                       //Setting up Google OAuth
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));






app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",                    //setting route for google auth.

    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets",            //google will then send back to this URL after providing data
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect("/secrets");
  }
);


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
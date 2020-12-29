

require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5");



const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(BodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({            //Schema for DB
    email: String,
    password: String
});



// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});


const User = mongoose.model("User", userSchema);        //model based on Schema




app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){

    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err){
        if(err){
            res.send(err);
        }else{
            res.render("secrets");
        }
    });

});

app.post("/login", function(req, res){              //now with this route we can check if the user is present in our DB

    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, function(err, foundUser){
        if(err){
            res.send("Username not found, kindly do register");
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }else{
                    res.send("Incorrect password, Login again!");
                }
            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server successfully started on port 3000");
});
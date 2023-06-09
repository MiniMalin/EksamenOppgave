//Importing required modules
const fs = require('fs')
const path = require('path')
const express = require('express')
const hbs = require('hbs')
const session = require('express-session')
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')
const multer = require('multer')

//Starting express server and setting the public directory path
const app = express()
const publicDirectoryPath = path.join(__dirname, "/public")
app.use(express.static(publicDirectoryPath))

//Setting up urlencoded middleware to enable access to request.body in post forms
app.use(express.urlencoded({ extended: true }));

//Adding Handlebars to enable server-side rendering
const viewPath = path.join(__dirname, "/views/pages")
const partialsPath = path.join(__dirname, "/views/partials")
app.set("view engine", hbs)
app.set('views',viewPath)
hbs.registerPartials(partialsPath)

//Setting up the database and exporting it along with the app and bcrypt for use in other files
const db = sqlite3('./data/proveeksamen.db', {verbose: console.log});

//Setting up express-session to handle, among other things, login functionality
app.use(session( {
    secret: 'Keep it secret',
    resave: false,
    saveUninitialized: false
}))

//File upload setup
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })

exports.app = app
exports.db = db
exports.bcrypt = bcrypt
exports.upload = upload
const { request } = require('express')
const setup = require('./setup.js')
const db = setup.db

const authPage = (permissions) => {
    return (request, response, next) => {
        if (request.session.logedIn === false || request.session.logedIn === undefined){
            response.redirect('/form')
            return
        }
        const sql = db.prepare('SELECT rolleID FROM Bruker WHERE brukerID = ?')
        const userRole = sql.get(request.session.userID)
        console.log(userRole.rolleID)

        if (permissions === userRole.rolleID) {
            next()
        } else {
            console.log('You do not have permission for this page!') 
            response.redirect('back')
        }
    }
}

function createUsername(firstName, lastName) {
    var username = "";
    
    if (firstName.length >= 3) {
      username += firstName.substring(0, 3);
    } else {
      username += firstName;
      for (var i = 0; i < (3 - firstName.length); i++) {
        username += Math.floor(Math.random() * 10);
      }
    }
    
    if (lastName.length >= 3) {
      username += lastName.substring(0, 3);
    } else {
      username += lastName;
      for (var i = 0; i < (3 - lastName.length); i++) {
        username += Math.floor(Math.random() * 10);
      }
    }
    
    return username;
  }
  

exports.authPage = authPage
exports.createUsername = createUsername
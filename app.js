const { request } = require('express')
const setup = require('./setup.js')
const authUser = require('./authUser.js')
const app = setup.app
const db = setup.db
const bcrypt = setup.bcrypt
const upload = setup.upload
const authPage = authUser.authPage
const createUsername = authUser.createUsername


//Handler fremsiden
app.get('',(request,response) => {


    response.render("index.hbs", {

    })
})

//Handler about-siden
app.get('/profil', (request,response) => {


    response.render("about.hbs", {

    })
})

//Handler about-siden
app.get('/bilder', (request,response) => {


    response.render("bilder.hbs", {

    })
})



app.get('/form', (request, response) => {
    // Render the form template with the chatroom information
    response.render('Login/form.hbs', {
        errorMessage: request.session.errorMessage
    })
    //Clear any error messages from the session
    request.session.errorMessage = ''
})

app.get('/newUser', (request, response) => {
    // Render the form template with the chatroom information
    response.render('Login/newUser.hbs')
})

//Handler fremsiden
app.get('/brukere', authPage(3), (request,response) => {

    const sql = db.prepare('SELECT * FROM Bruker_Klasse INNER JOIN Klasse ON Bruker_Klasse.Klasse_ID = Klasse.klasseID INNER JOIN Bruker ON Bruker_Klasse.Bruker_ID = Bruker.brukerID')
    const stmt = sql.all()

    const hent = db.prepare('SELECT * FROM Bruker')
    const bruker = hent.all()

    response.render("brukere.hbs", {
        stmt: stmt,
        bruker: bruker
    })
})

//Handler fremsiden
app.get('/klasser',(request,response) => {
    const sql1 = db.prepare('SELECT brukerID FROM Bruker WHERE brukerID = ?')
    const bruker = sql1.get(request.session.userID)

    // Prepare a SQL query to get user information by username
    const sql = db.prepare('SELECT * FROM Bruker_Klasse INNER JOIN Klasse ON Bruker_Klasse.Klasse_ID = Klasse.klasseID INNER JOIN Bruker ON Bruker_Klasse.Bruker_ID = Bruker.brukerID')
    const stmt = sql.all()

    const finn = db.prepare('SELECT * FROM Klasse')
    const klasser = finn.all()

    const hent = db.prepare('SELECT * FROM Bruker')
    const brukere = hent.all()

    const sql11 = db.prepare('SELECT Klasse_ID FROM Bruker_Klasse WHERE Bruker_ID = ?')
    const stmt1 = sql11.all(bruker.brukerID)
    console.log(stmt1[0].Klasse_ID)

    const sql111 = db.prepare('SELECT * FROM Bruker_Klasse INNER JOIN Klasse ON Bruker_Klasse.Klasse_ID = Klasse.klasseID INNER JOIN Bruker ON Bruker_Klasse.Bruker_ID = Bruker.brukerID WHERE Klasse_ID = ?')
    const stmt11 = sql111.all(stmt1[0].Klasse_ID)
    console.log(stmt11)

    response.render("klasser.hbs", {
        admin: stmt,
        klasser: stmt11,
        alleKlasser: klasser,
        alleBrukere: brukere
    })
})

//Handler fremsiden
app.get('/timeplan',(request,response) => {

    const sql1 = db.prepare('SELECT Klasse_ID FROM Bruker_Klasse WHERE Bruker_ID = ?')
    const bruker = sql1.get(request.session.userID)
    console.log(bruker)

    // Prepare a SQL query to get user information by username
    const sql = db.prepare('SELECT * FROM Timeplan INNER JOIN Klasse ON Timeplan.klasseID = Klasse.klasseID')
    const stmt = sql.all()

    const hent = db.prepare('SELECT * FROM Timeplan INNER JOIN Klasse ON Timeplan.klasseID = Klasse.klasseID WHERE Klasse.klasseID = ?')
    const plan = hent.all(bruker.Klasse_ID)

    const finn = db.prepare('SELECT * FROM Timeplan INNER JOIN Klasse ON Timeplan.klasseID = Klasse.klasseID WHERE Timeplan.klasseID = ?')
    const elev = finn.all(bruker.Klasse_ID)
    console.log(elev)

    response.render("timeplan.hbs", {
        timeplan: stmt,
        laererPlan: plan,
        elevPlan: elev
    })
})






//Handler for html-skjema med action /sendInn og method post
app.post('/login', async(request,response) => {

    // Prepare a SQL query to get user information by username
    const sql = db.prepare('SELECT * FROM Bruker WHERE brukernavn = ?')
    const stmt = sql.get(request.body.Uname)

    // If username exists and password is correct, set session to logged in
    // and redirect to homepage
    if (stmt && await bcrypt.compare(request.body.Pass, stmt.passord)) {
        request.session.logedIn = true
        request.session.userID = stmt.brukerID
        console.log(request.session.userID)
        response.redirect('/')
    } else {
        // If either username or password is incorrect, set session to not logged in
        // and render login form with an error message
        request.session.logedIn = false
        const errorMessage = 'Wrong username and/or password. Try again'
        request.session.errorMessage = errorMessage
        response.redirect('/form')
    } 
})

// Handle registration request of new user
app.post("/register", async (request, response) => {

    const fornavn = request.body.fnavn
    const mellomnavn = request.body.mnavn
    const etternavn = request.body.enavn
    const epost = request.body.epost
    const tlf = request.body.tlf
    const tlf2 = request.body.tlf2
    const passord = request.body.Pass
    const passordVal = request.body.PassVal
    const fødselsdato = request.body.fDato
    // Set number of salt rounds for password hashing
    const saltRounds = 10;

    const brukernavn = createUsername(fornavn, etternavn);
    console.log(brukernavn)

    // Prepare SQL statements to insert and get user information
    const insertUser = db.prepare("INSERT INTO Bruker (fnavn, mnavn, enavn, epost, tlf, extraTlf, brukernavn, passord, fødselsdato, rolleID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const getUser = db.prepare("SELECT * FROM Bruker WHERE epost = ?");
    const stmt = getUser.get(epost)
  
    // If password matches validation, hash password and add user to database
        if (passord === passordVal) {

            // If username already exists, set session to not logged in and show error message
            if (stmt) {
                request.session.logedIn = false
                const errorMessage = 'Epost er allerede tatt'
                response.render('newUser.hbs', {
                    errorMessage: errorMessage
                })
                
            } else {
                // If username is unique, hash password and insert user into database
                const hash = await bcrypt.hash(passord, saltRounds);
                insertUser.run(fornavn, mellomnavn, etternavn, epost, tlf, tlf2, brukernavn, hash, fødselsdato, 1);

                // Get information for the newly added user
                const newUser = getUser.get(epost)

                // Set session to logged in and set user ID
                request.session.logedIn = true
                request.session.userID = newUser.brukerID;
                console.log("vgjhbklm")

                // Redirect to homepage
                response.redirect('/')
            }
        } else {
            // If password and validation don't match, send error message
            const errorMessage = 'Password does not match'
            response.render('newUser.hbs', {
                errorMessage: errorMessage
            })
        }
  });

// Handle registration request of new user admin page
app.post("/insertBruker", async (request, response) => {

    const fornavn = request.body.fnavn
    const mellomnavn = request.body.mnavn
    const etternavn = request.body.enavn
    const epost = request.body.epost
    const tlf = request.body.tlf
    const tlf2 = request.body.tlf2
    const passord = request.body.Pass
    const passordVal = request.body.PassVal
    const fødselsdato = request.body.fDato
    const status = request.body.status
    // Set number of salt rounds for password hashing
    const saltRounds = 10;

    const brukernavn = createUsername(fornavn, etternavn);
    console.log(brukernavn)

    // Prepare SQL statements to insert and get user information
    const insertUser = db.prepare("INSERT INTO Bruker (fnavn, mnavn, enavn, epost, tlf, extraTlf, brukernavn, passord, fødselsdato, rolleID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const getUser = db.prepare("SELECT * FROM Bruker WHERE epost = ?");
    const stmt = getUser.get(epost)
  
    // If password matches validation, hash password and add user to database
        if (passord === passordVal) {

            // If username already exists, set session to not logged in and show error message
            if (stmt) {
                request.session.logedIn = false
                const errorMessage = 'Epost er allerede tatt'
                response.render('brukere.hbs', {
                    errorMessage: errorMessage
                })
                
            } else {
                // If username is unique, hash password and insert user into database
                const hash = await bcrypt.hash(passord, saltRounds);
                insertUser.run(fornavn, mellomnavn, etternavn, epost, tlf, tlf2, brukernavn, hash, fødselsdato, status);

                // Redirect back to last visited page
                response.redirect('back')
            }
        } else {
            // If password and validation don't match, send error message
            const errorMessage = 'Password does not match'
            response.render('brukere.hbs', {
                errorMessage: errorMessage
            })
        }
  });

// Log out route
app.post('/loggOut', (request,response) => {
    //Destroys session and redirects to login page
    request.session.destroy(function(err) {
        response.redirect('/');
      });
})

//Handler for å sende alle rader i tabellen melding, som json-data
app.get('/hentBilder', (request,response) => {
    const sql = db.prepare("SELECT * FROM Bilder INNER JOIN Bruker ON Bilder.opplastetAv = Bruker.brukerID")
    const meldinger = sql.all()
    
    for (const melding of meldinger) {
        console.log(melding)
    }
    response.send(meldinger)
})

//Handler for å sende alle rader i tabellen Rolle, som json-data
app.get('/hentRolle', (request,response) => {
    const finn = db.prepare("SELECT * FROM Bruker INNER JOIN Rolle ON Bruker.rolleID = Rolle.rolleID WHERE brukerID=(?)")
    const bruker = finn.all(request.session.userID)

    console.log(bruker[0].rolleID)

    const hent = db.prepare("SELECT * FROM Rolle WHERE rolleID=(?)")
    const rolle = hent.all(bruker[0].rolleID)
    
    response.send(rolle)
})

//Handler for html-skjema, og innsetting i tabellen Bilder
app.post('/insertBilde',  upload.single('image') , (request,response) => {
    const filename =  request.file.originalname
    const beskrivelse = request.body.beskrivelse
    const tid = request.body.tid;
    const opplaster = request.session.userID

    const sql = db.prepare('INSERT INTO Bilder (bilde, beskrivelse, tidspunkt, opplastetAv) VALUES (?, ?, ?, ?)');
    sql.run(filename, beskrivelse, tid, opplaster);
    response.redirect('back')
})

//Handler for html-skjema, og innsetting i tabellen Timeplan
app.post('/insertTimeplan',  upload.single('pdf') , (request,response) => {
    const filename =  request.file.originalname
    const ukeNr = request.body.ukeNr
    const klasse = request.body.klasse;

    const hent = db.prepare('SELECT klasseID FROM Klasse WHERE klasse = ?')
    const id = hent.get(klasse)

    const sql = db.prepare('INSERT INTO Timeplan (ukeNr, timeplanFil, klasseID) VALUES (?, ?, ?)');
    sql.run(ukeNr, filename, id.klasseID);
    response.redirect('back')
})

//Handler for html-skjema, og innsetting i tabellen Timeplan
app.post('/insertKlasseMedlem', async (request, response) => {
    const medlemID = request.body.medlemmer;
    const klasseID = request.body.klasse;
  
    const sql = db.prepare('INSERT INTO Bruker_Klasse (Bruker_ID, Klasse_ID) VALUES (?, ?)');
  
    for (const id of medlemID) {
      sql.run(id, klasseID);
    }
    response.redirect('back');
  });
  
// Route for changing a user's password
app.post('/changePassword', async(request,response) => {
    const saltRounds = 10
    // Prepare a SQL query to get user information by userID
    const getUser = db.prepare('SELECT * FROM Bruker WHERE brukerID = ?')
    const stmt = getUser.get(request.session.userID)
    
    // Compare the new password to the current password using bcrypt.compare
    const match = await bcrypt.compare(request.body.passord, stmt.passord);

    if (match) {
        //If new password and current password are matching, give error
        const errorMessagePassword = 'Ditt nye passord kan ikke være det samme som det forje'
        request.session.errorMessagePassword = errorMessagePassword
        response.redirect('/profil')
    } else {
        const password = request.body.password
        // If the new and current password are not matching, hash new password and update current password to new password
        // Update the user's password in the database using their user ID
        const sql = db.prepare("UPDATE Bruker SET passord=(?) WHERE brukerID = (?)");
        const hash = await bcrypt.hash(request.body.passord, saltRounds);
        const info = sql.run(hash, request.session.userID)
        response.redirect('/profil')
    } 
})

//Starter opp applikasjonen
app.listen(3000, () => console.log("Server is up! Check http://localhost:3000"))
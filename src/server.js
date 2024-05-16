const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
app.use(cors({
    origin: "*",
}));
require('dotenv').config(); // Allows me to access .env variables

mongoose.set('strictQuery', false)
const bodyParser = require('body-parser');

const port = process.env.port || 3000;
const mongoUrl = process.env.databaseUrl;
const dbName = process.env.databaseName;

// Will use mongoose (mongo) for BBDD

app.use(bodyParser.json());

// move name of connection to .env
mongoose.connect(mongoUrl + dbName)
.then(() => {
    console.log("Succesfully connected to DB");
    })
    .catch((error) => {
        console.error("Error connection to DB", error)
    });

const UserModel = mongoose.model('matriculados', {
    username: { type: String },
    password: { type: String },
    name: { type: String },
    surname: { type: String },
    second_surname: { type: String },
    address: { type: String},
    date_of_birth: { type: String },
    identity: { type: String },
    tutor: {
        name: { type: String },
        identity: { type: String }
    },
    telephone: { type: String },
    email: { type: String },
    enrollment_date: { type: String },
    iban: { type: String },
    enrolled_in: { type: String },
    rol: { type: String }
});

app.listen(port, () => {
    console.log(`Listening on port ${port} 🚀`)
})

// Route for handling login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body)
    try {
        const user = await UserModel.findOne({ username }).exec();
        
        if(!user) {
            return res.status(401).send("Invalid username");
        }

        // Verify password
        if (user.password !== password) {
            return res.status(401).send("Invalid password");
        }

        res.status(200).send({
            message: "Login successful!",
            userId: user._id,
            rol: user.rol
          });

    } catch (error) {
        console.error("Error finding user: ", error);
        return res.status(500).send("Internal Server Error");
    }
})


app.put('/changepassword', async (req, res) => {
    console.log("Body " + req.body)
    const { username, identityDocument, newPassword} = req.body;
    let user;
    try{
        user = await UserModel.findOne({ username }).exec();

        console.log("REQ BODY: ", req.body)
        console.log("identity reqBody: ", identityDocument)
        if(!user) {
            return res.status(401).send("Invalid username");
        }

        if(user.identity !== identityDocument) {
            return res.status(401).send("Invalid identity number")
        }

    } catch (error) {
        console.error("Error finding user: ", error);
        return res.status(500).send("Internal Server Error");
    }

    user.password = newPassword;
    user.save();
    res.status(200).send("Password changed succesfully!")

})
app.post('/register', async (req, res) => {
    try {
        const { username, password, name, surname, identity } = req.body;
        if (!username || !password || !name || !surname || !identity) {
            console.log("Body: ", req.body)
            return res.status(400).send("Missing required fields");
        }
        console.log("BODY: ", req.body)

        // Check if the username is already taken
        const existingUser = await UserModel.findOne({ username }).exec();
        if (existingUser) {
            return res.status(400).send("Username already exists");
        }

        // Create a new user object
        const newUser = new UserModel({
            ...req.body,
            rol: "user"
        });
    
        // Save the user data to MongoDB
        await newUser.save();

        // Send a success response
        res.status(201).send("User registered successfully");
    } catch (error) {
        console.error("Error registering user: ", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/user/profile/:id', async (req, res) => {
    const userId = req.params.id
    console.log("User: ", userId)

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).send({ message: 'User not found' })
        }

        res.status(200).send({
            message: 'Acquired user profile!',
           username: user.username,
           name: user.name
        });
    } catch(error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }


   
})
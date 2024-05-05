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

const RegisteredUser = mongoose.model('matriculados', {
    username: { type: String },
    password: { type: String }
});

// Route for handling login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await RegisteredUser.findOne({ username }).exec()
        
        console.log("User found:", user);

        if(!user) {
            return res.status(401).send("Invalid username");
        }

        // Verify password
        if (user.password !== password) {
            return res.status(401).send("Invalid password");
        }

        res.status(200).send("Login successful");

    } catch (error) {
        console.error("Error finding user: ", error);
        return res.status(500).send("Internal Server Error");
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port} 🚀`)
})
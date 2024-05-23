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

const purchaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    username: {
        type: String
    },
    menjadorQuantity: {
        type: Number,
    },
    matineraQuantity: {
        type: Number,
    },
    articles: [
        {
            id: String,
            name: String,
            price: Number,
        }
    ],
    extracurriculars: [
        {
            id: String,
            name: String,
            price: Number,
        }
    ],
    total: {
        type: Number,
    },
    purchaseDate: {
        type: String
    }
});

const validatePurchase = mongoose.model('validar-compras', purchaseSchema);

const invoiceModel = mongoose.model('facturas', purchaseSchema)

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
            nombre: user.name,
            apellido: user.surname,
            segundo_apellido: user.second_surname,
            direccion: user.address,
            fecha_de_nacimiento: user.date_of_birth,
            numero_de_identidad: user.identity,
            telefono: user.telephone,
            email: user.email
        });
    } catch(error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
})

app.get('/users/search', async (req, res) => {

    try {
        const users = await UserModel.find({});

        if (!users) {
            return res.status(404).send({ message: 'Users not found' })
        }

        res.status(200).send({
            message: 'Acquired user profile!',
            users: users
        });

    } catch(error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
})

app.post('/user/:id/purchase', async (req, res) => {
    try {
        console.log('Purchase request body:', req.body);

        const userId = req.params.id;
        const user = await UserModel.findById(userId)
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

        const newPurchase = new validatePurchase({
            ...req.body,
            userId: userId,
            username: user.username,
            purchaseDate: formattedDate
        });
        // Save the user data to MongoDB
        await newPurchase.save();
        res.status(201).send("Purchased succesfully!");
    } catch(error) {
        console.error('Error saving purchase:', error);
        res.status(500).send('Internal Server Error')
    }
    

})

app.get('/admin/validations', async (req, res) => {
    try {
        const validations = await validatePurchase.find({});
        res.status(200).json(validations);
    } catch(error) {
        res.status(500).send('Internal Server Error')
    }
})

app.delete('/admin/validations/:purchaseId', async (req, res) => {
    try {
        const purchaseId = req.params.purchaseId;

        await validatePurchase.findByIdAndDelete(purchaseId)
        
        res.status(201).send('Deleted purchase succesfully!')
    } catch(error) {
        console.error('Error deleting purchase:', error);
        res.status(500).send('Internal Server Error')
    }
})

app.post('/admin/invoice', async (req, res) => {
    try {
        const newInvoice = new invoiceModel({
            ...req.body
        });

        await newInvoice.save();
        res.status(200).send('Arrived here hello!')
    } catch(error) {
        res.status(500).send('Internal Server Error')
    }
})

app.get('/user/invoices/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Query invoices collection based on user ID
        const invoices = await invoiceModel.find({ userId: userId });
        res.status(200).json(invoices);
    } catch(error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send('Internal Server Error');
    }
});
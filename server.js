const app = require('express')();
const bodyParser = require('body-parser');
const port = 3000;

// Will use mongoose (mongo) for BBDD

app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('Get request to the homepage')
})

app.get('/hello', (req, res) => {
    res.status(200).send("Holaa" + "")
})

app.post('/login', (req, res) => {

})

app.listen(port, () => {
    console.log(`Listening on port ${port} 🚀`)
})
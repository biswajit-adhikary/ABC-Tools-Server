const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Set Port
const port = process.env.PORT || 5000;

// Set Middleware
app.use(cors());
app.use(express.json());

// JWT token verify
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ Message: 'Unauthorized Access!' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    })
}

// Connect DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jhlp5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Create API
async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('abctools').collection('tools');
        const reviewCollection = client.db('abctools').collection('reviews');
        const userCollection = client.db('abctools').collection('users');
        const orderCollection = client.db('abctools').collection('orders');

        // // JWT token
        // app.post('/login', async (req, res) => {
        //     const user = req.body;
        //     const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        //         expiresIn: '1d'
        //     });
        //     res.send({ accessToken });
        // })

        // API for get tools
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // API for get one tool
        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolsCollection.findOne(query);
            res.send(result);
        });

        // API for get reviews
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Create User API
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        })


        // API for create order
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        })

        // API for all order
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Get single order
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);
        });


        // Get My Order API
        app.get('/my-orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
        })


    } finally { }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Back-End Server Running!');
});

app.listen(port, () => {
    console.log('Console Running!');
});
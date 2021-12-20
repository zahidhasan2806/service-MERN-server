const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const fileUpload = require('express-fileupload')


//middleaware
app.use(cors());
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xohwd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("colorZen");
        const serviceCollection = database.collection("services");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection("reviews")


        //POST API for  new products
        app.post("/services", async (req, res) => {
            const name = req.body.name;
            const desc = req.body.desc;
            const time = req.body.time;
            const phone = req.body.phone;
            const price = req.body.price;
            const picture1 = req.files.picture1;
            const picture2 = req.files.picture2;
            const picture1Data = picture1.data;
            const picture2Data = picture2.data;
            const encodedData1 = picture1Data.toString('base64')
            const encodedData2 = picture2Data.toString('base64')
            const imgBuffer1 = Buffer.from(encodedData1, 'base64')
            const imgBuffer2 = Buffer.from(encodedData2, 'base64')
            const data = {
                name, desc, price, time, phone,
                image1: imgBuffer1, image2: imgBuffer2
            }
            const result = await serviceCollection.insertOne(data);
            res.json(result);
        })







        //GET API for all the services showing UI
        app.get("/services", async (req, res) => {
            const result = serviceCollection.find({});
            const services = await result.toArray();
            res.send(services);

        })
        app.get("/services/:id", async (req, res) => {
            const serviceDetails = await serviceCollection.findOne({ _id: ObjectId(req.params.id) });
            res.send(serviceDetails);
        })


        //Delete API- delete products
        app.delete('/services/:id', async (req, res) => {
            const deletedService = await serviceCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.json(deletedService)
        });


        //POST API for Products order
        app.post('/orders', async (req, res) => {
            const orders = await ordersCollection.insertOne(req.body);
            res.json(orders);
        });
        //GET API-orders 
        app.get('/orders', async (req, res) => {
            const orders = await ordersCollection.find({}).toArray();
            res.send(orders);
        });

        //Delete API- delete order
        app.delete('/orders/:id', async (req, res) => {
            const deletedOrder = await ordersCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.json(deletedOrder)
        });
        // Update user status
        app.put('/orders/:id', async (req, res) => {
            const order = req.body;
            const options = { upsert: true };
            const updatedOrder = {
                $set: {
                    status: order.status,
                }
            };

            const updateStatus = await ordersCollection.updateOne({ _id: ObjectId(req.params.id) }, updatedOrder, options,)
            res.json(updateStatus);
        });

        //POST API- all users siging with email
        app.post('/users', async (req, res) => {
            const users = await usersCollection.insertOne(req.body);
            res.json(users);
        });

        //PUT API -user
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        //Update user role 
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })


        //POST new review
        app.post("/reviews", async (req, res) => {
            const newReview = (req.body);
            const result = await reviewsCollection.insertOne(newReview);
            res.json(result);
        })
        //GET API-reviews
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews);
        });



        console.log('connected successfully');

    } finally {
        //await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(' server is running');
});

app.listen(port, () => {
    console.log('server running at port', port);
});
const Express = require("express");

const BodyParser = require("body-parser");

const MongoClient = require("mongodb").MongoClient;

const ObjectId = require("mongodb").ObjectID;

const imdb = require('./src/imdb');

const DENZEL_IMDB_ID = 'nm0000243';







const CONNECTION_URL = "mongodb+srv://root:root@denzelmovies-696nb.mongodb.net/test?retryWrites=true";

const DATABASE_NAME = "denzelmovies";



var app = Express();



app.use(BodyParser.json());

app.use(BodyParser.urlencoded({ extended: true }));



var database;

var collection;

var movies;



//Create Database connection

MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {

    if (error) {

        console.log(error);

        throw error;

    }

    console.log('Connected');

    database = client.db(DATABASE_NAME);

    collection = database.collection("movies");

    console.log("Connected to `" + DATABASE_NAME + "`!");

});



//Populate database

app.get('/movies/populate', (req, res) => {

    if (!collection) {

        return res.status(500).send('Database not connected');

    }

    imdb(DENZEL_IMDB_ID).then((val) => {

        movies = val;

        collection.insert(movies, (error, result) => {

            if (error) {

                return res.status(500).send(error);

            }

            console.log('populating sucessful');

            res.send(result.result);

        });

    });

});



//Get random must watch movie

app.get('/movies', (req, res) => {

    if (!collection) {

        return res.status(500).send('Database not connected');

    }

    collection.find({ metascore: { $gte: 70 } }).toArray((error, result) => {

        if (error) {

            return res.status(500).send(error);

        }

        var index = Math.floor(Math.random() * result.length);

        var movie = result[index].title;

        res.send(movie);

    });

});



//Search movie

app.get('/movies/search', (req, res) => {

    if (!collection) {

        return res.status(500).send('Database not connected');

    }

    var limit = (Number(req.query.limit)) ? Number(req.query.limit) : 5;

    var metascore = (Number(req.query.metascore)) ? Number(req.query.metascore) : 0;

    collection.aggregate([{ $match: { metascore: { $gte: metascore } } }, { $limit: limit }, { $sort: { metascore: -1 } }]).toArray((error, result) => {

        if (error) {

            return res.status(500).send(error);

        }

        res.send(result);

    });

});



//Get movie by id

app.get('/movies/:id', (req, res) => {

    if (!collection) {

        return res.status(500).send('Database not connected');

    }

    var id = req.params.id;

    collection.find({ id: id }).toArray((error, result) => {

        if (error) {

            return res.status(500).send(error);

        }

        if (result.length > 0) {

            res.send(result[0]);

        }

        else {

            res.status(500).send({ error: `no match for id : ${id}` });

        }



    });

});



app.post('/movies/:id', (req, res) =>{

    var id = req.params.id;

    var date = req.query.date;

    var review = req.params.review;

    console.log('param : ' + JSON.stringify(req.params));

    console.log('query : ' + JSON.stringify(req.query));

    console.log('body : ' + JSON.stringify(req.body));

    console.log(`id : ${id}; date : ${date}; review : ${review}`);

});



//Path not found

app.get('*', (req, res) => {

    res.status(404).send({ error: 'path not found' });

});





app.listen(8080);
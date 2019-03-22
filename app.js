const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';



const CONNECTION_URL = "mongodb+srv://client1:client1@cluster0-maf1t.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "denzelmovies";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database;
var collection;
var movies;


MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
    if (error) {
        console.log(error);
        throw error;
    }
    console.log('Connected');
    database = client.db(DATABASE_NAME);
    collection = database.collection("test");
    console.log("Connected to " + DATABASE_NAME + "!");
});




app.get('/movies/populate', (req, res) => {
    if (!collection) {
        return res.status(500).send('Database not connected');
    }
    imdb(DENZEL_IMDB_ID).then((val) => {
        movies = val;
        collection.insertMany(movies, (error, result) => {
            if (error) {
                return res.status(500).send(error);
            }
            console.log('populating sucessful of ' + result.result.n + " movies");
            retour = { "total" : result.result.n };
            res.send(retour);
            var liste = result.sort(result.metascore);
            console.log(liste.length);
        });
    });
});





app.get('/movies', (req, res) => {
    if (!collection) {
        return res.status(500).send('Database not connected');
    }
    collection.find({ metascore: { $gt: 70 } }).toArray((error, result) => {
        if (error) {
            return res.status(500).send(error);
        }
        var index = Math.floor(Math.random() * result.length);
        var movie = result[index].title;
        res.send(movie);
        console.log(result[index]);


    });
});


app.get('/movies/search', (req, res) => {
    if (!collection) {
        return res.status(500).send('Database not connected');
    }
    var met = req.query.met;
    var limit = req.query.limit;
    console.log(req.query)
    collection.find({ metascore: { $gte: +met }}).toArray((error, result) => {
        if (error) {
            return res.status(500).send(error);
        }
        var tab = []
        for (var i = 0; i<limit; i++){
            
            var index = Math.floor(Math.random() * result.length);
            //var movie = result[index].title;
            //res.send(movie);
            tab.push(result[i]);
            //console.log(index);
            //console.log(result[i]);
        }
        var f = function(a,b){
            return a>b ;
        } 

        function tri(l,f){
            for(var i= 0 ; i< l.length; i++){  
                for(var j=i+1; j< l.length; j++){
                    if(f( l[j].metascore, l[i].metascore) ){
                        var temp = l[j];
                        l[j]=l[i];
                        l[i]=temp;
                    }
                }
            }
            return l ;
        }
        
        console.log(tri(tab,function(a,b){ return a>b ;}));

        res.send(tab);
        
        
    }); 
})

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
            res.send(result[0].title);
        }
        else {
            res.status(500).send({error : `no match for id : ${id}`});
        }
        console.log(result[0]);

    });
});


app.post('/movies/:id', (req, res) => {
    if (!collection) {
        return res.status(500).send('Database not connected');
    }
    var id = req.params.id;
    collection.find({ id: id }).toArray((error, result) => {
        if (error) {
            return res.status(500).send(error);
        }
        if (result.length > 0) {
            var review = req.body;
            if(result[0].reviews){
                collection.updateOne({id : id}, { $push: {'reviews' :  review }}, function(err, res) {
                    if(err){
                        console.log(err)
                        throw err;
                    }
                    console.log(result[0]);
                });
                res.send({ "_id" :result[0]._id, "reviews" : result[0].reviews});
            }
            else {
                collection.deleteOne({id : id});
                var movie = result[0];
                movie.reviews = [ review ];
                collection.insertOne(movie, (error, result) => {
                    if (error) {
                        return res.status(500).send(error);
                    }
                    console.log(result.ops[0]);
                    res.send({ "_id" : result.ops[0]._id});
                });
            }
        }
        else {
            res.status(500).send({error : `no match for id : ${id}`});
        }

    });
})



app.get('*', (req, res) => {
    res.status(404).send({ error: 'path not found' });
});



app.listen(9292);
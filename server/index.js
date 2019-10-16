const keys = require('./keys'); //Keys to connect with redis and postgres

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
	user: keys.pgUser,
	host: keys.pgHost,
	database: keys.pgDatabase,
	password: keys.pgPassword,
	port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

//Create Postgres table of the fibo index values
pgClient.query('CREATE TABLE IF NOT EXISTS values(number INT)')
		.catch( err => console.log( err ));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate(); //We need to duplicate because by redis, a connection only can be created for one porpouse.

//Express route handlers

app.get('/', (req, res ) => {
	res.send('Hi');
});

//Get all the values stored by postgres
app.get('/values/all', async ( req, res ) => {
	const values = await pgClient.query('SELECT * FROM values');

	res.send(values.rows); //Only return the records, postgress send more data.
});

//Return all the diferent indexes and values from redis
app.get('/values/current', ( req, res ) => { //redis doesn't have promise support, so we have to do it with callbacks.
	redisClient.hgetall('values', ( err, values ) => {
		res.send( values );
	});
});

app.post('/values', (req, res ) => {
	const index = req.body.index;

	if ( parseInt( index ) > 40 ) {
		return res.status(422).send('Index too high');
	}

	redisClient.hset('values', index, 'Nothing yet!'); //The worker will replace that nothing with the calculated value.
	redisPublisher.publish('insert', index); //This put a message insert, that the worker was listening.
	pgClient.query('INSERT INTO values(number) VALUES($1)', [index]); //Insert the type value to postgres.

	res.send({ working: true });
});

//The server will be listening on port 5000.

app.listen(5000, err => {
	console.log('Listening');
});
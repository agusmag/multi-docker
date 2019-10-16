const keys = require('./keys'); //File with credentials to connect with redis.

//Redis connection
const redis = require('redis');

const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

//Function to calculate fibonacci values

function fib(index) {
	if ( index < 2 ) return 1;
	return fib( index -1 ) + fib( index - 2 );
}

//Listen redis requests and calculate the fib value

sub.on('message', ( channel, message ) => {
	redisClient.hset('values', message, fib( parseInt( message )));
});

//Everytime that someone send the insert message, the worker is going to execute the .on function
sub.subscribe('insert');
/*
**
** Primary file for the API
**
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var config = require('./config');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
//Instantiate the HTTP server  
var httpServer = http.createServer(function(req, res){
    unifiedServer(req,res);
});


//Start the HTTP server 
httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on port "+config.httpPort)
});

//Instantiate the HTTPS server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem' )
};
var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req,res);
});


//Start the HTTPS server 
httpsServer.listen(config.httpsPort, function(){
    console.log("The server is listening on port "+config.httpsPort)
});
//All the server logic for both the HTTP and HTTPS server
var unifiedServer = function(req, res){
 
    //Get the url and parse it
    var parsedUrl = url.parse(req.url, true); 

    //Get the path 
    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query strings as an object

    var queryStringObject = parsedUrl.query;

    var headers = req.headers;

    //Get the payload if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data);
    })
    req.on('end',function(){
        buffer +=decoder.end();

        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'quseryStringObject': queryStringObject,
            'method': httpMethod,
            'headers': headers,
            'payload': buffer 
        }

        //Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode,payload){
             //Use the status code called back by the handler or the default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
             //use the payload called back by the handler, or default to an empty object

             payload = typeof(payload) == 'object' ? payload : {};

             //Convert the payload to a string
           var payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type','application/json');
             //Return the response
             res.writeHead(statusCode);
                 //Send the response
            res.end(payloadString );
             //Log the request path
    console.log('Returning this response: ',statusCode,payloadString  )
});
        });
    
   
    var httpMethod = req.method.toLowerCase();
}

var handlers = {};

handlers.sample = function(data,callback){
    callback(406,{'name': 'sample handler'})
}

handlers.notFound = function(data,callback){
    callback(404);
}
var router = {
    'sample' : handlers.sample
}
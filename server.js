// call all the required packages
const util 							= require('util');
const express 						= require('express');
const http 							= require('http');
const socketIO 						= require('socket.io');
const fs        					= require('fs');
const bodyParser 					= require('body-parser');
const multer 						= require('multer');
const hbs 							= require('express-handlebars');
const { MongoClient, ObjectId } 	= require('mongodb');
const dbURL 						= 'mongodb://localhost:27017?replicaSet=rs0';

let db,
	collection,
	changeStream;

// Server stuff
const app 							= express();
const server 						= http.createServer(app);
const io 							= socketIO(server);
const port 							= process.env.PORT || 3000;

// configure server
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'hbs');
app.engine( 'hbs', hbs( {
	extname: 'hbs',
	defaultView: 'default',
	layoutsDir: __dirname + '/views/layouts/',
	partialsDir: __dirname + '/views/partials/'
}));

// Base64 Encoder
var arrayBufferToBase64 = function(buffer) {

    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));

    return Buffer.from(binary).toString('base64');
    // return Buffer.from(buffer).toString('base64');
};

var hex2Ascii = function(str1) {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
};

// SET STORAGE
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads')
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now())
	}
});
 
var upload = multer({ storage: storage });
 
//ROUTES
app.get('/', (req, res) => {

	// Get the most recent 7 images (latest from each arduino pair, in theory)
	// collection.find({}).sort({ $natural: -1 }).limit(7).toArray( (err, results) => {
	collection.find({}).sort({ $natural: -1 }).toArray( (err, results) => {
    	if (err) return console.log(err);
      	
      	let images = [];
      	for (var r in results) {
        	images.push({
        		"image": 'data:image/bmp;base64,' + arrayBufferToBase64(results[r].image.buffer),
        		"text": String.fromCharCode.apply(null, results[r].image.buffer)
        	});
        }

        console.log("images", images);
    
    	res.render('index', {
    		layout: 'default', 
    		template: 'index',
    		images: images
    	});
	});
});

app.get('/upload',function(req,res){
	res.render('upload', {
    	layout: 'default', 
    	template: 'upload'
    });
});

// for saving image from RPi or web interface
app.post('/save', upload.single('file'), (req, res) => {

	// Define a JSONobject for the image attributes for saving to database
	var finalImg = {
		contentType: 'image/bmp',
		image: fs.readFileSync(req.file.path)
	};

	db.collection('images').insertOne(finalImg, (err, result) => {
		// console.log("result", result);
 
		if (err) return console.log(err);
 
		console.log('saved to database');
		res.redirect('/');
	});
});

// app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
// 	const file = req.file;

// 	if (!file) {
// 		const error = new Error('Please upload a file');
// 		error.httpStatusCode = 400;

// 		return next(error);
// 	}
// 	res.send(file);
// });

// Web socket server to auto update screen when a new img is added to the DB
io.on('connection', socket => {
	// console.log('New client connected');

	// start listen to changes
	changeStream && changeStream.on('change', function(event) {
		console.log('Got DB change', JSON.stringify(event));
		socket.emit('refresh');
	});
	
	socket.on('disconnect', () => console.log('Client disconnected'));
});

// Connect to DB and then bring up server
MongoClient.connect(dbURL, { useNewUrlParser: true }, (err, client) => {

	if (err) return console.log(err);

	db = client.db('compostpile');
	collection = db.collection('images');
	
	// Watch for any changes to the images collection
	changeStream = collection.watch();

	server.listen(port, () => console.log(`Listening on port ${port}`));
});
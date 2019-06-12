# compost pile
Mongo / Express / Node.js / Socket-IO app for where digital files go to rot.

**0/ set up mongodb**  
This assumes you have homebrew package manager installed for OS X. Read more about homebrew here: https://brew.sh/  

Steps shown here taken from MongoDB docs: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/  

`$ brew tap mongodb/brew`  
`$ brew install mongodb-community@4.0`  
`$ mongod --config /usr/local/etc/mongod.conf`  
`$ brew services start mongodb-community@4.0`  

**> Create a directory on your local machine in the root of this project to store data**  
`$ mkdir -p /data/db`  

**> Now create the database by starting a mongo shell**  
`$ mongo`  
`> use compostpile`  

**Next we have to create a so-called replica of our database**  
...so we can take advantage of a newish feature of Mongo DB which allows our web app to know when a change has been made to the database. We want to know every time something has been added to the DB so we can pull the data out and display it via a web socket on our web page.  

`$ mongo`  
`> use admin`  
`> db.shutdownServer()`  
`> exit`  
`$ mongod --port 27017 --dbpath ./data/db --replSet rs0 --bind_ip localhost --fork --logpath var/log/mongod.log`  

**1/ install node dependencies and start our server**   
`$ npm init`  
`$ node server.js`  

###Additional resources I read while setting this project up:###  
https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088  
https://medium.com/@colinrlly/send-store-and-show-images-with-react-express-and-mongodb-592bc38a9ed  
https://severalnines.com/blog/real-time-data-streaming-mongodb-change-streams  
https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/  

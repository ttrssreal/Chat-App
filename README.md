Chat-App is a school project written in Nodejs. It uses Express and EJS for the backend and templating language respectively.
It makes use of Passportjs for authentication and Socketio/Websockets for realtime client server communication.
An Sqlite database was used for user accounts, and room names. For HTML/JS sanitization, DOMPurify was used.

### How to run:
1. Install [NodeJS](https://nodejs.org/en/)
2. run `git clone https://github.com/ttrssreal/Chat-App`
3. run `cd Chat-App`
4. run `npm install` to get dependencies
5. finally run `node app.js`

You can build an image and run it in a docker container for fun if you want.

### How to run with docker:
1. Install Docker
2. run `git clone https://github.com/ttrssreal/Chat-App`
3. run `sudo docker build .`
4. run `sudo docker ps` and get the CONTAINER ID
5. finally run `sudo docker run -p 9999:9999 CONTAINER ID` and replace CONTAINER ID with your one
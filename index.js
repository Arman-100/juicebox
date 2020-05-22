require("dotenv").config();

const PORT = 3000;
const express = require("express");
const server = express();
const { client } = require("./db");
client.connect();

server.listen(PORT, () => {
  console.log("the server is up on port", PORT);
});

const bodyParser = require("body-parser");
server.use(bodyParser.json());

const morgan = require("morgan");
server.use(morgan("dev"));

server.use((req, res, next) => {
  console.log("Body start");
  console.log(req.body);
  console.log("Body end");

  next();
});

const apiRouter = require("./api");
server.use("/api", apiRouter);

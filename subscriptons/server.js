const express = require("express");
const pino = require("pino");

const config = require("./config");

const app = express();
const logger = pino();

app.use(express.json());

const loadRepositories = require("./repositories");
const loadControllers = require("./controllers");

const repositories = loadRepositories(config);
loadControllers(app, repositories, logger);

const port = config.port;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");

module.exports = function(deployer) {
  deployer.deploy(Will, config.pingInterval);
};
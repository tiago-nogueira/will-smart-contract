/* 
// For deployment on the blockchain
const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");
module.exports = function(deployer) {
  deployer.deploy(Will, config.pingInterval);
}; */

// For testing
const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");

const ERC1820 = artifacts.require("ERC1820Registry");
const Token777 = artifacts.require("Token777");
const Token777_2 = artifacts.require("Token777_2");
const Token20 = artifacts.require("Token20");

module.exports = function(deployer) {
  deployer.deploy(Will, config.pingInterval)
  .then(() => {
  	return deployer.deploy(ERC1820);
  }).then(() => {
  	return deployer.deploy(
  		Token777,
  		ERC1820.address,
  		"",
  		"",
  		10000000000000, // 13 zeros
  		10000000000, 	// 10 zeros
  		[]
  	);
  }).then(() => {
    return deployer.deploy(
      Token777_2,
      ERC1820.address,
      "",
      "",
      10000000000000, // 13 zeros
      10000000000,  // 10 zeros
      []
    );
  }).then(() => {
    return deployer.deploy(
      Token20,
      1000000000000000) // 15 zeros
  });
};
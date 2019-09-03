const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");

let WillInstance;
let addressZero = "0x0000000000000000000000000000000000000000";
let pingInterval = config.pingInterval;

contract("Will - heir", accounts => {
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
		});
	});

	async function checkNoPing(receipt) {
		let length = receipt.logs.filter(i => i.event == "Ping").length;
		assert.equal(length, 0, "No 'ping' event must have been emited");
	}

	function accessDenied(error) {
		return assert(error.message.indexOf("Access denied") >= 0);	
	}

	// Setting up
	it("owner sets the heir", () => {
		return WillInstance.setHeir(accounts[1], { from: accounts[0] });
	});

	it("owner deposits ether", () => {
		return WillInstance.deposit({ value: 100 });
	});

	// Testing
	it("tries to execute the will before the time", () => {
		return WillInstance.executeNow({ from: accounts[1] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			// check the owner
			return WillInstance.getOwner.call();
		}).then(owner => {
			assert.equal(owner, accounts[0])
		});
	});

	it("checks if it's executable", () => {
		return WillInstance.isExecutable.call({ from: accounts[1] })
		.then(bool => {
			assert(!bool, "Will must not be executable yet");
			return WillInstance.isExecutable({ from: accounts[1] });
		}).then(receipt => {
			return checkNoPing(receipt);
		});
	});		

	it("gets time remaining", () => {
		return WillInstance.timeRemaining.call( {from: accounts[1] })
		.then(time => {
			assert(time <= pingInterval && time >= 0);
			return WillInstance.timeRemaining( {from: accounts[1] } );
		}).then(receipt => {
			return checkNoPing(receipt);
		});
	});

	it("gets owner address", () => {
		return WillInstance.getOwner.call({ from: accounts[1] })
		.then(owner => {
			assert.equal(owner, accounts[0], "Owner must be 'account 0'");
			return WillInstance.getOwner({ from: accounts[1] });
		}).then(receipt => {
			return checkNoPing(receipt);
		});
	});

	it("gets heir address", () => {
		return WillInstance.getHeir.call()
		.then(heir => {
			assert.equal(heir, accounts[1], "Heir must be " + accounts[1]);
		}).then(() => {
			return WillInstance.getHeir({ from: accounts[1] });
		}).then(receipt => {
			return checkNoPing(receipt);
		});
	});

	it("tries to get ping interval", () => {
		return WillInstance.getPingInterval({ from: accounts[1] })
		.then(assert.fail).catch(error => {
			accessDenied(error);		
		});
	});

	it("tries to ping", () => {
		return WillInstance.ping({ from: accounts[1] })
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Access denied" >= 0));
		});
	});

	it("tries to set heir address", () => {
		return WillInstance.setHeir(accounts[2], { from: accounts[1] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to set the pingInterval", () => {
		return WillInstance.setPingInterval(310, { from: accounts[1] })
		.then(assert.fail).catch(error => {
			accessDenied(error);			
			return WillInstance.getPingInterval.call();
		}).then(value => {
			assert.equal(value, pingInterval);
		});
	});

	it("tries to deposit ether", () => {
		return WillInstance.deposit({ value: 1, from: accounts[1] })
		.then(assert.fail).catch(error => {
			return accessDenied(error);
		});
	});

	it("tries to get the balance", () => {
		return WillInstance.getBalance({ from: accounts[1] })
		.then(assert.fail).catch(error => {
			return accessDenied(error);
		});
	});

	it("tries to withdraw", () => {
		return WillInstance.withdraw(1, { from: accounts[1] })
		.then(assert.fail).catch(error => {
			return accessDenied(error);
		});
	});

	it("tries to withdraw the entire balance", () => {
		return WillInstance.withdrawAll({ from: accounts[1] })
		.then(assert.fail).catch(error => {
			return accessDenied(error);
		});
	});

	it("executes the will", () => {
		return WillInstance.executeNow({ from: accounts[1] })
		.then(receipt => {
			assert.equal(receipt.logs.length, 2);
			assert.equal(receipt.logs[0].event, "WillExecuted")
			assert.equal(receipt.logs[0].args[0], accounts[1]);
		}).then(() => {
			// checking owner and heir
			return WillInstance.getOwner.call({ from: accounts[1] });
		}).then(owner => {
			assert.equal(owner, accounts[1]);
			return WillInstance.getHeir.call({ from: accounts[1] });
		}).then(heir => {
			assert.equal(heir, addressZero);
		});
	});	
})
const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");

let WillInstance;
let blockNumber;
let lastPing = 0;
let addressZero = "0x0000000000000000000000000000000000000000";
let pingInterval = config.pingInterval;

contract("Will - intruder", accounts => {
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
			return web3.eth.getBlockNumber();
		}).then(block => {
			blockNumber = block;
		});
	});

	async function getPingEvent() {
		return WillInstance.getPastEvents("Ping", { from: blockNumber + 1, to: 'latest' });
	}

	async function checkNoPing() {
		let event = await getPingEvent(WillInstance, blockNumber);
		assert.equal(event.length, 0, "No 'ping' event must have been emited");
	}

	async function checkHeir(heir) {
		return WillInstance.getHeir.call()
		.then(_heir => {
			assert.equal(_heir, heir, "Heir must be " + heir);
		});	
	}

	async function checkBalance(balance) {
		return WillInstance.getBalance.call()
		.then(_balance => {
			assert.equal(_balance, balance, "Balance should be: " + balance);
		});
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
	it("tries to get owner address", () => {
		return WillInstance.getOwner({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});

	it("tries to get heir address", () => {
		return WillInstance.getHeir({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});

	it("tries to get ping interval", () => {
		return WillInstance.getPingInterval({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);		
			return checkNoPing();
		});
	});

	it("tries to get time remaining", () => {
		return WillInstance.timeRemaining( {from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});

	it("tries to check if it's executable", () => {
		return WillInstance.isExecutable( {from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});

	it("tries to ping", () => {
		return WillInstance.ping({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});	

	it("tries to set the heir", () => {
		return WillInstance.setHeir(accounts[4], { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkHeir(accounts[1]);
		}).then(() => {
			return checkNoPing();
		})
	});

	it("tries to set the pingInterval", () => {
		return WillInstance.setPingInterval(310, { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);

			return WillInstance.getPingInterval.call();
		}).then(value => {
			assert.equal(value, pingInterval);
		});
	});

	it("tries to deposit ether", () => {
		return WillInstance.deposit({ value: 1, from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});	

	it("tries to get the balance", () => {
		return WillInstance.getBalance({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkNoPing();
		});
	});

	it("tries to withdraw", () => {
		return WillInstance.withdraw(1, { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			return checkBalance(100);
		}).then(() => {
			return checkNoPing();
		});
	});	

	it("tries to withdraw the entire balance", () => {
		return WillInstance.withdrawAll({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			return checkBalance(100);
		}).then(() => {
			return checkNoPing();
		});
	});	

	it("tries to execute the will", () => {
		return WillInstance.executeNow({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
			// check the owner
			return WillInstance.getOwner.call();
		}).then(owner => {
			assert.equal(owner, accounts[0])
			return checkNoPing();
		});
	});
})
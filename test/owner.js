const Will = artifacts.require("Will");

let WillInstance;
let blockNumber;
let lastPing = 0;
let addressZero = "0x0000000000000000000000000000000000000000";
let pingInterval = 2;

contract("Will - owner", accounts => {
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

	async function checkPing() {
		let event = await getPingEvent(WillInstance, blockNumber);
		assert.equal(event.length, 1, "One 'ping' event must have been emited");
		assert.equal(event[0].event, "Ping", "Event type must be 'Ping'");
		assert(event[0].blockNumber > lastPing, "Must be a new ping");
		lastPing = event[0].blockNumber;
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

	it("gets owner address", () => {
		return WillInstance.getOwner.call()
		.then(owner => {
			assert.equal(owner, accounts[0], "Owner must be 'account 0'");
			return WillInstance.getOwner();
		}).then(() => {
			checkPing();
		});
	});

	it("gets heir address", () => {
		return checkHeir(addressZero)
		.then(() => {
			return WillInstance.getHeir();
		}).then(() => {
			checkPing();
		});
	});

	it("gets ping interval", () => {
		return WillInstance.getPingInterval.call()
		.then(interval => {
			assert.equal(interval, pingInterval, "Interval must be " + pingInterval);
			return WillInstance.getPingInterval();
		}).then(() => {
			return checkPing();
		});
	});

	it("gets time remaining", () => {
		return WillInstance.timeRemaining.call()
		.then(time => {
			assert(time <= pingInterval && time >= 0);
			return WillInstance.timeRemaining();
		}).then(() => {
			return checkPing();
		});
	});

	it("checks if it's executable", () => {
		return WillInstance.isExecutable.call()
		.then(bool => {
			assert(!bool, "Will must not be executable yet");
			return WillInstance.isExecutable();
		}).then(() => {
			return checkPing();
		});
	});	

	it("pings", () => {
		return WillInstance.ping()
		.then(() => {
			return checkPing();
		});
	});

	it("tries to execute the will before setting the heir", () => {
		return WillInstance.executeNow()
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Heir not set") >= 0);
			// check the owner
			return WillInstance.getOwner.call()
		}).then(owner => {
			assert.equal(owner, accounts[0])
			return checkNoPing();
		});
	});

	it("tries to set heir address to '0x0'", () => {
		return WillInstance.setHeir(addressZero, { from: accounts[0] })
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Can't set heir address to '0x0'" >= 0));

			return checkNoPing();
		}).then(() => {
			return checkHeir(addressZero);
		});
	});

	it("sets the heir", () => {
		return WillInstance.setHeir(accounts[1], { from: accounts[0] })
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Two event must have been emited");
			assert.equal(receipt.logs[0].event, "HeirSet", "'HeirSet' event");
			assert.equal(receipt.logs[0].args[0], accounts[1], "Heir must be 'accounts[1]'");

			return checkPing();
		}).then(() => {
			return checkHeir(accounts[1]);
		});
	});

	it("sets the ping interval", () => {
		return WillInstance.setPingInterval(310)
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Two event must have been emited");
			assert.equal(receipt.logs[0].event, "PingIntervalSet", "'PingIntervalSet' event");
			assert.equal(receipt.logs[0].args[0], 310, "PingInterval must be 310");

			return WillInstance.getPingInterval.call();
		}).then(value => {
			assert.equal(value, 310);
		});
	});

	it("deposits ether", () => {
		return WillInstance.deposit.call({ value: 100 })
		.then(balance => {
			assert.equal(balance.toNumber(), 100)
			return WillInstance.deposit({ value: 100 });
		}).then(() => {
			return checkPing();
		});
	});

	it("gets the balance", () => {
		return checkBalance(100)
		.then(() => {
			return WillInstance.getBalance();
		}).then(receipt => {
			return checkPing();
		});
	});	

	it("tries to withdraw more than the balance", () => {
		return WillInstance.withdraw(101)
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Amount shouldn't exceed the balance") >= 0);
			return checkBalance(100);
		}).then(() => {
			return checkNoPing();
		});
	});

	it("withdraws part of the balance", () => {
		return WillInstance.withdraw(20)
		.then(receipt => {
			return checkBalance(80);
		}).then(() => {
			return checkPing();
		});
	});

	it("withdraws the entire balance", () => {
		return WillInstance.withdrawAll.call()
		.then(amount => {
			assert.equal(amount.toNumber(), 80);
			return WillInstance.withdrawAll();
		}).then(receipt => {
			return checkBalance(0);
		}).then(() => {
			return checkPing();
		});
	});

	it("executes the will", () => {
		return WillInstance.executeNow()
		.then(receipt => {
			assert.equal(receipt.logs.length, 2);
			assert.equal(receipt.logs[1].event, "WillExecuted")
			assert.equal(receipt.logs[1].args[0], accounts[1]);
			return checkPing();
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
});
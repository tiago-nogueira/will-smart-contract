const Will = artifacts.require("Will");
const config = require("../config_ping_interval.js");

let WillInstance;
let addressZero = "0x0000000000000000000000000000000000000000";
let pingInterval = config.pingInterval;

contract("Will - owner", accounts => {
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
		});
	});

	async function checkPing(receipt) {
		let [log] = receipt.logs.filter(i => i.event == "Ping");
		assert.equal(log.event, "Ping", "Event type must be 'Ping'");
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
			assert.equal(_balance.toNumber(), balance, "Balance should be: " + balance);
		});
	}

	it("gets time remaining", () => {
		return WillInstance.timeRemaining.call()
		.then(time => {
			assert(time <= pingInterval && time >= 0);
			return WillInstance.timeRemaining();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("checks if it's executable", () => {
		return WillInstance.isExecutable.call()
		.then(bool => {
			assert(!bool, "Will must not be executable yet");
			return WillInstance.isExecutable();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("gets owner address", () => {
		return WillInstance.getOwner.call()
		.then(owner => {
			assert.equal(owner, accounts[0], "Owner must be 'account 0'");
			return WillInstance.getOwner();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("gets heir address", () => {
		return checkHeir(addressZero)
		.then(() => {
			return WillInstance.getHeir();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("gets ping interval", () => {
		return WillInstance.getPingInterval.call()
		.then(interval => {
			assert.equal(interval, pingInterval, "Interval must be " + pingInterval);
			return WillInstance.getPingInterval();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("pings", () => {
		return WillInstance.ping()
		.then(receipt => {
			return checkPing(receipt);
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
		});
	});

	it("tries to set heir address to '0x0'", () => {
		return WillInstance.setHeir(addressZero, { from: accounts[0] })
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Can't set heir address to '0x0'" >= 0));
		});
	});

	it("sets the heir", () => {
		return WillInstance.setHeir(accounts[1], { from: accounts[0] })
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Two event must have been emited");
			assert.equal(receipt.logs[0].event, "HeirSet", "'HeirSet' event");
			assert.equal(receipt.logs[0].args[0], accounts[1], "Heir must be 'accounts[1]'");

			return checkPing(receipt);
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

			return checkPing(receipt);
		}).then(() => {
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
		}).then(receipt => {
			return checkPing(receipt);
		});
	});

	it("gets the balance", () => {
		return checkBalance(100)
		.then(() => {
			return WillInstance.getBalance();
		}).then(receipt => {
			return checkPing(receipt);
		});
	});	

	it("tries to withdraw more than the balance", () => {
		return WillInstance.withdraw(101)
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Amount shouldn't exceed the balance") >= 0);
		});
	});

	it("withdraws part of the balance", () => {
		return WillInstance.withdraw(20)
		.then(receipt => {
			return checkPing(receipt);
		}).then(() => {
			return checkBalance(80);
		});
	});

	it("withdraws the entire balance", () => {
		return WillInstance.withdrawAll.call()
		.then(amount => {
			assert.equal(amount.toNumber(), 80);
			return WillInstance.withdrawAll();
		}).then(receipt => {
			return checkPing(receipt);
		}).then(() => {
			return checkBalance(0);
		});
	});

	it("executes the will", () => {
		return WillInstance.executeNow()
		.then(receipt => {
			assert.equal(receipt.logs.length, 2);
			assert.equal(receipt.logs[1].event, "WillExecuted")
			assert.equal(receipt.logs[1].args[0], accounts[1]);
			return checkPing(receipt);
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
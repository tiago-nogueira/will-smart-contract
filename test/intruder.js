const Will = artifacts.require("Will");
let WillInstance;

contract("Will - intruder", accounts => {
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
		});
	});

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
		});
	});

	it("tries to get heir address", () => {
		return WillInstance.getHeir({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to get ping interval", () => {
		return WillInstance.getPingInterval({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to get time remaining", () => {
		return WillInstance.timeRemaining( {from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to check if it's executable", () => {
		return WillInstance.isExecutable( {from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to ping", () => {
		return WillInstance.ping({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});	

	it("tries to set the heir", () => {
		return WillInstance.setHeir(accounts[4], { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to set the pingInterval", () => {
		return WillInstance.setPingInterval(310, { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to deposit ether", () => {
		return WillInstance.deposit({ value: 1, from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});	

	it("tries to get the balance", () => {
		return WillInstance.getBalance({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});

	it("tries to withdraw", () => {
		return WillInstance.withdraw(1, { from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});	

	it("tries to withdraw the entire balance", () => {
		return WillInstance.withdrawAll({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});	

	it("tries to execute the will", () => {
		return WillInstance.executeNow({ from: accounts[9] })
		.then(assert.fail).catch(error => {
			accessDenied(error);
		});
	});
})
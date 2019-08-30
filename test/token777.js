const Will = artifacts.require("Will");
const Token777 = artifacts.require("Token777");
const Token777_2 = artifacts.require("Token777_2")

let WillInstance;
let Token777Instance;
let Token777_2Instance;

contract("Token777", accounts => {
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
			return Token777.deployed().then(instance => {
				Token777Instance = instance;
				return Token777_2.deployed().then(instance => {
					Token777_2Instance = instance;
				});
			});
		});
	});

	async function checkTokenAddresses(...addrs) {
		return WillInstance.getERC777Addresses.call()
		.then(list => {
			assert.equal(list.length, addrs.length, "Lists' sizes not matching")
			for(let i = 0; i < list.length; i++) {
				assert.equal(list[i], addrs[i], "Element " + i + " not matching");
			}
		});		
	}

	it("first token owner approves will contract as operator", () => {
		return Token777Instance.authorizeOperator(WillInstance.address)
		.then(receipt => {
			assert.equal(receipt.logs.length, 1, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "AuthorizedOperator", "Correct event");
			assert.equal(receipt.logs[0].args.operator, WillInstance.address, "Correct operator");
			assert.equal(receipt.logs[0].args.tokenHolder, accounts[0], "Correct token holder");
		});
	});

	it("second token owner approves will contract as operator", () => {
		return Token777_2Instance.authorizeOperator(WillInstance.address)
		.then(receipt => {
			assert.equal(receipt.logs.length, 1, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "AuthorizedOperator", "Correct event");
			assert.equal(receipt.logs[0].args.operator, WillInstance.address, "Correct operator");
			assert.equal(receipt.logs[0].args.tokenHolder, accounts[0], "Correct token holder");
		});
	});

	it("checks token addresses", () => {
		return checkTokenAddresses();
	});

	it("catalogs the first token", () => {
		return WillInstance.setTokenERC777(Token777Instance.address, 10000000000)
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "TokenERC777Set", "Correct event");
			assert.equal(receipt.logs[0].args.tokenContract, Token777Instance.address, "Correct token contract");
			assert.equal(receipt.logs[0].args.amount, 10000000000, "Correct amount");
			return checkTokenAddresses(Token777Instance.address);
		});
	})

	it("catalogs the second token", () => {
		return WillInstance.setTokenERC777(Token777_2Instance.address, 10000000000000)
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "TokenERC777Set", "Correct event");
			assert.equal(receipt.logs[0].args.tokenContract, Token777_2Instance.address, "Correct token contract");
			assert.equal(receipt.logs[0].args.amount, 10000000000000, "Correct amount");
			return checkTokenAddresses(Token777Instance.address, Token777_2Instance.address);
		});
	})

	it("gets first token amount", () => {
		return WillInstance.getAmountERC777.call(Token777Instance.address)
		.then(amount => {
			assert.equal(amount, 10000000000, "Amount should be " + 10000000000);
		});
	});

	it("resets first token", () => {
		return WillInstance.setTokenERC777(Token777Instance.address, 10000000000000)
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "TokenERC777Set", "Correct event");
			assert.equal(receipt.logs[0].args.tokenContract, Token777Instance.address, "Correct token contract");
			assert.equal(receipt.logs[0].args.amount, 10000000000000, "Correct amount");
			return checkTokenAddresses(Token777Instance.address, Token777_2Instance.address);
		});
	})

	it("gets first token amount again", () => {
		return WillInstance.getAmountERC777.call(Token777Instance.address)
		.then(amount => {
			assert.equal(amount, 10000000000000, "Amount should be " + 10000000000000);
		});
	});

	it("gets first token owner", () => {
		return WillInstance.getOwnerERC777.call(Token777Instance.address)
		.then(owner => {
			assert.equal(owner, accounts[0], "Amount should be " + accounts[0]);
		});
	});

	it("owner sets the heir", () => {
		return WillInstance.setHeir(accounts[1], { from: accounts[0] })
		.then(receipt => {
		});
	});

	it("owner executes the will", () => {
		return WillInstance.executeNow()
		.then(receipt => {
		});
	});	

	it("transfers the tokens to the new owner", () => {
		return WillInstance.transferTokenERC777(Token777Instance.address, { from: accounts[1] })
		.then(receipt => {
			assert.equal(receipt.logs.length, 2, "Correct number of logs");
			assert.equal(receipt.logs[0].event, "TokenERC777Transfered", "Correct event");
			assert.equal(receipt.logs[0].args.tokenContract, Token777Instance.address, "Correct token contract");
			assert.equal(receipt.logs[0].args.amount, 10000000000000, "Correct amount");

			// Checking token balances
			return Token777Instance.balanceOf(accounts[0]);
		}).then(balance => {
			assert.equal(balance, 0);
			return Token777Instance.balanceOf(accounts[1]);
		}).then(balance => {
			assert.equal(balance, 10000000000000);
		});
	});

	it("checks token addresses", () => {
		return WillInstance.getERC777Addresses.call({ from: accounts[1] })
		.then(list => {
			assert.equal(list.length, 1, "List should have one token address");
			assert.equal(list[0], Token777_2Instance.address, "Address should be" + Token777_2Instance.address);
		});
	});

	it("tries to reset a token", () => {
		return WillInstance.setTokenERC777(Token777_2Instance.address, 10000000000000)
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Can't change token cataloged by previous owner"))
			// Checking token list
			return WillInstance.getERC777Addresses.call({from: accounts[1] });
		}).then(list => {
			assert.equal(list.length, 1, "List should have one token address");
			assert.equal(list[0], Token777_2Instance.address, "Address should be" + Token777_2Instance.address);
		});
	});
});
const Will = artifacts.require("Will");
const Token777 = artifacts.require("Token777");
const Token777_2 = artifacts.require("Token777_2");
const Token20 = artifacts.require("Token20");

let WillInstance;
let Token777Instance;
let Token777_2Instance;
let Token20Instance;

contract("Tokens", accounts => {
	let owner = accounts[0];	
	beforeEach(() => {
		return Will.deployed().then(instance => {
			WillInstance = instance;
			return Token777.deployed().then(instance => {
				Token777Instance = instance;
				return Token777_2.deployed().then(instance => {
					Token777_2Instance = instance;
					return Token20.deployed().then(instance => {
						Token20Instance = instance;
					});
				});
			});
		});
	});

	async function checkTokenAddresses(...addrs) {
		return WillInstance.getTokensAddresses.call({ from: owner })
		.then(list => {
			assert.equal(list.length, addrs.length, "Lists' sizes not matching")
			for(let i = 0; i < list.length; i++) {
				assert.equal(list[i], addrs[i], "Element " + i + " not matching");
			}
		});		
	}

	function checkReceipt(receipt, num, event, ...args) {
		assert.equal(receipt.logs.length, num, num + " event must be emited");		
		assert.equal(receipt.logs[0].args.__length__, args.length, `Event must have ${args.length} arguments`);
		assert.equal(receipt.logs[0].event, event);
		for(let i = 0; i < args.length; i++) {
			assert.equal(receipt.logs[0].args[i], args[i] , `Argument ${i} must be: '${args[i]}'`);
		}		
	}	

	it("first token owner approves will contract as operator", () => {
		return Token777Instance.authorizeOperator(WillInstance.address)
		.then(receipt => {
			return checkReceipt(receipt, 1, "AuthorizedOperator", WillInstance.address, accounts[0]);
		});
	});

	it("second token owner approves will contract as operator", () => {
		return Token20Instance.approve(WillInstance.address, 1000000)
		.then(receipt => {
			return checkReceipt(receipt, 1, "Approval", accounts[0], WillInstance.address, 1000000);
		});
	});

	it("third token owner approves will contract as operator", () => {
		return Token777_2Instance.authorizeOperator(WillInstance.address)
		.then(receipt => {
			return checkReceipt(receipt, 1, "AuthorizedOperator", WillInstance.address, accounts[0]);
		});
	});

	it("checks token addresses", () => {
		return checkTokenAddresses();
	});

	it("catalogs the first token (ERC777)", () => {
		return WillInstance.setToken(true, Token777Instance.address, 10000000000)
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenSet", true, Token777Instance.address, 10000000000);
			return checkTokenAddresses(Token777Instance.address);
		});
	});

	it("catalogs the second token (ERC20)", () => {
		return WillInstance.setToken(false, Token20Instance.address, 1000000)
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenSet", false, Token20Instance.address, 1000000);
			return checkTokenAddresses(Token777Instance.address, Token20Instance.address);
		});
	});	

	it("catalogs the third token (ERC777)", () => {
		return WillInstance.setToken(true, Token777_2Instance.address, 10000000000000)
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenSet", true, Token777_2Instance.address, 10000000000000);
			return checkTokenAddresses(
				Token777Instance.address, Token20Instance.address, Token777_2Instance.address);
		});
	});

	it("gets first token amount", () => {
		return WillInstance.getTokenAmount.call(Token777Instance.address)
		.then(amount => {
			assert.equal(amount, 10000000000, "Amount should be " + 10000000000);
		});
	});

	it("resets first token", () => {
		return WillInstance.setToken(true, Token777Instance.address, 10000000000000)
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenSet", true, Token777Instance.address, 10000000000000);
			return checkTokenAddresses(
				Token777Instance.address, Token20Instance.address, Token777_2Instance.address);
		});
	})

	it("gets first token amount again", () => {
		return WillInstance.getTokenAmount.call(Token777Instance.address)
		.then(amount => {
			assert.equal(amount, 10000000000000, "Amount should be " + 10000000000000);
		});
	});

	it("gets first token owner", () => {
		return WillInstance.getTokenOwner.call(Token777Instance.address)
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

	it("transfers tokens to the new owner", () => {
		owner = accounts[1];		
		return WillInstance.transferToken(Token20Instance.address, { from: accounts[1] })
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenTransfered", false, Token20Instance.address, 1000000);
			// Checking token balances
			return Token20Instance.balanceOf(accounts[0]);
		}).then(balance => {
			assert.equal(balance, 1000000000000000 - 1000000);
			return Token20Instance.balanceOf(accounts[1]);
		}).then(balance => {
			assert.equal(balance, 1000000);
			return checkTokenAddresses(Token777Instance.address, Token777_2Instance.address)
		});
	});

	it("transfers another token to the new owner", () => {
		return WillInstance.transferToken(Token777Instance.address, { from: accounts[1] })
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenTransfered", true, Token777Instance.address, 10000000000000);
			// Checking token balances
			return Token777Instance.balanceOf(accounts[0]);
		}).then(balance => {
			assert.equal(balance, 0);
			return Token777Instance.balanceOf(accounts[1]);
		}).then(balance => {
			assert.equal(balance, 10000000000000);
			return checkTokenAddresses(Token777_2Instance.address)			
		});
	});

	it("tries to reset a token", () => {
		return WillInstance.setToken(true, Token777_2Instance.address, 10000000000000)
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Can't change token cataloged by previous owner"))
			// Checking token list
			return WillInstance.getTokensAddresses.call({from: accounts[1] });
		}).then(list => {
			assert.equal(list.length, 1, "List should have one token address");
			assert.equal(list[0], Token777_2Instance.address, "Address should be" + Token777_2Instance.address);
			return checkTokenAddresses(Token777_2Instance.address)			
		});
	});

	it("tries to delete an uncataloged token", () => {
		return WillInstance.deleteToken.call(accounts[9], { from: accounts[1] })
		.then(assert.fail).catch(error => {
			assert(error.message.indexOf("Unknown contract address") >= 0);
			return checkTokenAddresses(Token777_2Instance.address);		
		});
	});

	it("deletes a token", () => {
		return WillInstance.deleteToken(Token777_2Instance.address, { from: accounts[1] })
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenDeleted", Token777_2Instance.address);
			return checkTokenAddresses();			
		});
	});

	it("catalogs the ERC20 again", () => {
		return WillInstance.setToken(false, Token20Instance.address, 1000000, { from: accounts[1] })
		.then(receipt => {
			checkReceipt(receipt, 2, "TokenSet", false, Token20Instance.address, 1000000);
			return checkTokenAddresses(Token20Instance.address);
		});
	});	
});
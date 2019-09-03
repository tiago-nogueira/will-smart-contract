pragma solidity 0.5.8;

contract Token20 {
	// Total supply of tokens
	uint256 public totalSupply;

	// Name, symbol and version of the token
	string public name = "TucoCoin";
	string public symbol = "TCC";
	string public standard = "TucoCoin v1.0";

	// Balance of the accounts
	mapping(address => uint256) private balances;
	// Allowances
	mapping(address => mapping(address => uint256)) private approvedTransfers;

	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
	);
	event Approval(
		address indexed _owner,
		address indexed _spender,
		uint256 _value
	);

	constructor(uint256 _initialSupply) public {
		balances[msg.sender] = _initialSupply;  // Owner
		totalSupply = _initialSupply;
	}

	function balanceOf(address tokenHolder) public view returns (uint256) {
		return balances[tokenHolder];
	}

	// Transfer tokens
	function transfer(address _to, uint256 _value) public returns (bool) {
		// Requires that account has enough to transfer
		require(balances[msg.sender] >= _value);
		// Transfer the amount of tokens
		balances[msg.sender] -= _value;
		balances[_to] += _value;
		// Transfer event
		emit Transfer(msg.sender, _to, _value);
		return true;
	}

	// Approve transfer
	function approve(address _spender, uint256 _value) public returns (bool) {
		// Recording allowance
		approvedTransfers[msg.sender][_spender] = _value;
		// Emit approval event
		emit Approval(msg.sender, _spender, _value);
		return true;
	}

	// Show allowance
	function allowance(address _owner, address _spender) public view returns (uint256) {
		return approvedTransfers[_owner][_spender];
	}

	// Make previously approved transfer
	function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
		// Require transfer is approved
		require(approvedTransfers[_from][msg.sender] >= _value);

		// Require owner have the amount
		require(balances[_from] >= _value);

		// Transfer
		balances[_from] -= _value;
		balances[_to] += _value;

		// Update approval
		approvedTransfers[_from][msg.sender] -= _value;

		// Emit transfer event
		emit Transfer(_from, _to, _value);
		return true;
	}
}
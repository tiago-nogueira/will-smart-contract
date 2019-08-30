pragma solidity 0.5.8;

contract Will {
	address private owner;
	address private heir;
	uint256 private executableWhen; // in seconds
	uint256 private pingInterval;  // in seconds

	mapping(address => TokenERC777) private erc777;
	address[] private erc777Addrs;
    string constant private erc777Sig = "operatorSend(address,address,uint256,bytes,bytes)";

	constructor(uint256 _pingInterval) public {
		owner = msg.sender;
		pingInterval = _pingInterval;
		ping();
	}

	event Ping(uint256 indexed expiresWhen);
	event HeirSet(address indexed heir);
	event PingIntervalSet(uint256 indexed pingInterval);
	event TokenERC777Set(address indexed tokenContract, uint256 indexed amount);
	event TokenERC777Transfered(address indexed tokenContract, uint256 indexed amount);	
	event WillExecuted(address indexed newOwner);

	struct TokenERC777 {
		uint256 amount;
		address tokenOwner;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Access denied");
		_;
		ping();
	}

	modifier ownerOrHeir() {
		require(msg.sender == owner || msg.sender == heir, 
			"Access denied");
		_;
		if(msg.sender == owner) ping();
	}

	function ping() public {
		require(msg.sender == owner, "Access denied");
		executableWhen = pingInterval.add(now);
		executableWhen = now + pingInterval;
		require(executableWhen > now, "Avoiding overflow");
		emit Ping(executableWhen);
	}

	function getOwner() external ownerOrHeir returns(address){return owner;}
	function getHeir() external ownerOrHeir returns(address){return heir;}

	function setHeir(address _heir) external onlyOwner{
		require(_heir != address(0), "Can't set heir address to '0x0'");
		heir = _heir;
		emit HeirSet(heir);
	}

	function setPingInterval(uint256 _seconds) external onlyOwner{
		pingInterval = _seconds;
		emit PingIntervalSet(pingInterval);
	}

	function getPingInterval() external onlyOwner returns(uint256){
		return pingInterval;
	}

	function timeRemaining() external ownerOrHeir returns(uint256 remaining){
		uint256 timeNow = now;
		if (timeNow < executableWhen)
			remaining = executableWhen - timeNow;
	}

	function isExecutable() external ownerOrHeir returns(bool){
		return now >= executableWhen;
	}

	function getBalance() external onlyOwner returns(uint256){
		return address(this).balance;
	}

	function executeNow() external ownerOrHeir{
		require(heir != address(0), "Heir not set");
		if (msg.sender == heir) require(now >= executableWhen, "Access denied");
		else ping(); // If the heir is the caller, it will ping on the ownerOrHeir modifier
		owner = heir;
		heir = address(0);
		emit WillExecuted(owner); // new owner
	}	

	function deposit() external payable onlyOwner returns(uint256){
		return address(this).balance;
	}

	function withdraw(uint256 amount) external onlyOwner{
		require(amount <= address(this).balance, "Amount shouldn't exceed the balance");
		msg.sender.transfer(amount);
	}

	function withdrawAll() external onlyOwner returns(uint256 balance){
		balance = address(this).balance;
		msg.sender.transfer(balance);
	}

	// ERC777 functions
	function setTokenERC777(address tokenContract, uint256 amount) external onlyOwner{
		if (erc777[tokenContract].tokenOwner == address(0)) {
			newToken777(tokenContract, amount);
		} else {
			require(erc777[tokenContract].tokenOwner == owner, "Can't change token cataloged by previous owner");
			erc777[tokenContract].amount = amount;
		}
		emit TokenERC777Set(tokenContract, amount);
	}

	function getAmountERC777(address tokenContract) external onlyOwner returns(uint256){
		return erc777[tokenContract].amount;
	}

	function getOwnerERC777(address tokenContract) external onlyOwner returns(address){
		return erc777[tokenContract].tokenOwner;
	}

	function getERC777Addresses() external onlyOwner returns(address[] memory) {
		return erc777Addrs;
	}

	function transferTokenERC777(address tokenContract) external onlyOwner{
		address from = erc777[tokenContract].tokenOwner;
		uint256 amount = erc777[tokenContract].amount;
		deleteToken777(tokenContract);
		(bool result, bytes memory b) = tokenContract.call(abi.encodeWithSignature(
			erc777Sig,
			from,
			owner,
			amount,
			"",
			""
		));
		require(result, "Unable to transfer");
		emit TokenERC777Transfered(tokenContract, amount);
	}

	// Helper functions
	function newToken777(address tokenContract, uint256 amount) private {
		erc777[tokenContract].amount = amount;
		erc777[tokenContract].tokenOwner = owner;
		erc777Addrs.push(tokenContract);
	}

	function deleteToken777(address tokenContract) private {
		delete erc777[tokenContract];
		for(uint256 i = 0; i < erc777Addrs.length; i++) {
			if (erc777Addrs[i] == tokenContract) {
				erc777Addrs[i] = erc777Addrs[erc777Addrs.length - 1];
				erc777Addrs.length--;
				return;
			}
		}
		revert("Unknown contract address");
	}
}
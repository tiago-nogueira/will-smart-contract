pragma solidity 0.5.8;

contract Will {
	address private owner;
	address private heir;
	uint256 private executableWhen; // in seconds
	uint256 private pingInterval;  // in seconds

	constructor(uint256 _pingInterval) public {
		owner = msg.sender;
		pingInterval = _pingInterval;
		ping();
	}

	event Ping(uint256 indexed expiresWhen);
	event HeirSet(address indexed heir);
	event PingIntervalSet(uint256 indexed pingInterval);
	event WillExecuted(address indexed newOwner);

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
		executableWhen = now + pingInterval;
		emit Ping(executableWhen);
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

	function setHeir(address _heir) external onlyOwner{
		require(_heir != address(0), "Can't set heir address to '0x0'");
		heir = _heir;
		emit HeirSet(heir);
	}

	function getHeir() external ownerOrHeir returns(address){return heir;}

	function getOwner() external ownerOrHeir returns(address){return owner;}

	function getBalance() external onlyOwner returns(uint256){
		return address(this).balance;
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

	function executeNow() external ownerOrHeir{   //falta testar
		require(heir != address(0), "Heir not set");
		if (msg.sender == heir) require(now >= executableWhen, "Access denied");
		else ping(); // If the heir executes it, it will ping on the ownerOrHeir modifier
		owner = heir;
		heir = address(0);
		emit WillExecuted(owner); // new owner
	}
}
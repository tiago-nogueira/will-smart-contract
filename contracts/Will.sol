pragma solidity 0.5.8;

contract Will {
	address private owner;
	address private heir;
	uint256 private executableWhen; // in seconds
	uint256 private pingInterval;  // in seconds

	mapping(address => Token) private token;
	address[] private tokensAddrs;
	string constant private erc20Sig = "transferFrom(address,address,uint256)";
    string constant private erc777Sig = "operatorSend(address,address,uint256,bytes,bytes)";

	constructor(uint256 _pingInterval) public {
		owner = msg.sender;
		pingInterval = _pingInterval;
		ping();
	}

	event Ping(uint256 indexed expiresWhen);
	event HeirSet(address indexed heir);
	event PingIntervalSet(uint256 indexed pingInterval);
	event TokenSet(bool indexed _type, address indexed tokenAddr, uint256 indexed amount);
	event TokenDeleted(address indexed tokenAddr);
	event TokenTransfered(bool indexed _type, address indexed tokenAddr, uint256 indexed amount);	
	event WillExecuted(address indexed newOwner);

	struct Token {
		bool kind; // false for ERC-20 / true for ERC-777
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

	// Token functions
	function setToken(bool kind, address tokenAddr, uint256 amount) external onlyOwner{
		if (token[tokenAddr].tokenOwner == address(0)) {
			newToken(kind, tokenAddr, amount);
		} else {
			require(token[tokenAddr].tokenOwner == owner, "Can't change token cataloged by previous owner");
			token[tokenAddr].amount = amount;
		}
		emit TokenSet(kind, tokenAddr, amount);
	}

	function getTokenType(address tokenAddr) external onlyOwner returns(bool){ // falta testar
		return token[tokenAddr].kind;
	}	

	function getTokenAmount(address tokenAddr) external onlyOwner returns(uint256){
		return token[tokenAddr].amount;
	}

	function getTokenOwner(address tokenAddr) external onlyOwner returns(address){
		return token[tokenAddr].tokenOwner;
	}

	function getTokensAddresses() external onlyOwner returns(address[] memory) {
		return tokensAddrs;
	}

	function deleteToken(address tokenAddr) external onlyOwner{
		deleting(tokenAddr);
		emit TokenDeleted(tokenAddr);
	}

	function transferToken(address tokenAddr) external onlyOwner{
		bool kind = token[tokenAddr].kind;
		address from = token[tokenAddr].tokenOwner;
		uint256 amount = token[tokenAddr].amount;
		deleting(tokenAddr);
		bool result;
		bytes memory b;
		if(kind) { // ERC-777
			(result, b) = tokenAddr.call(abi.encodeWithSignature(
				erc777Sig,
				from,
				owner,
				amount,
				"",
				""
			));
		} else { // ERC-20
			(result, b) = tokenAddr.call(abi.encodeWithSignature(
				erc20Sig,
				from,
				owner,
				amount
			));
		}
		require(result, "Unable to transfer");
		emit TokenTransfered(kind, tokenAddr, amount);
	}

	// Helper functions
	function newToken(bool kind, address tokenAddr, uint256 amount) private {
/*		token[tokenAddr].kind = kind;		
		token[tokenAddr].amount = amount;
		token[tokenAddr].tokenOwner = owner;
*/		token[tokenAddr] = Token(kind, amount, owner);
		tokensAddrs.push(tokenAddr);
	}

	function deleting(address tokenAddr) private {
		delete token[tokenAddr];
		for(uint256 i = 0; i < tokensAddrs.length; i++) {
			if(tokensAddrs[i] == tokenAddr) {
				tokensAddrs[i] = tokensAddrs[tokensAddrs.length - 1];
				tokensAddrs.length--;
				return;
			}
		}
		revert("Unknown contract address");
	}
}
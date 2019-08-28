# Will Smart Contract

# Project Title

An smart contract for the Ethereum platform that functions as a will, transfering funds from the contract owner to an specified address when certain conditions are met.

## Dependencies

npm
Truffle
Ganache

## Installing

Clone the repository and cd into the 'will' directory

```
git clone https://github.com/tiago-nogueira/will-smart-contract
cd will
```

Make sure Ganache is running

Now you can migrate the contract

```
truffle migrate --reset
```

## Running the tests

Run the tests with truffle

```
truffle test
```
Some of the tests are time dependent, so you might have to adjust one variable depending on your machine speed
If tests like 'checks if it's executable' or 'gets time remaining' are failing, you should increase the pingInterval. If 'executes the will' go wrong, you should decrease it.

To adjust the pingInterval, just change the number value on the config_ping_interval.js file in the root directory.

## Author

Tiago Nogueira (https://github.com/tiago-nogueira)

## Acknowledgments

* Thanks PurpleBooth for the README template (https://gist.github.com/PurpleBooth/109311bb0361f32d87a2#file-readme-template-md)

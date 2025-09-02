// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Carbon {
    int private value = 0;
    address private org;

    constructor(address owner) {
        org = owner;
    }

    function setprice(int evalue) public {
        require(
            msg.sender == org,
            "Somente a organizacao autorizada pode definir o preco."
        );  
        value = evalue;
    }

    function getprice() public view returns (int) {
        return (value);
    }
}

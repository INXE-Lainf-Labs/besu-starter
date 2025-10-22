// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract TranferCoin{

      uint gainvalue;

      function sendEther(address payable _to, uint amount) public payable {
        // Method 1: transfer (reverts on failure, 2300 gas limit)
        _to.transfer(msg.value);

        gainvalue = amount * 2 /  100;

        // Method 2: call (more flexible, returns bool)
        // (bool sent, ) = _to.call{value: msg.value}("");
        // require(sent, "Transfer failed");
    }

    function getgainvalue() public view returns (uint) {
        return gainvalue; 
    }


    
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Push0Test {
    function testPush0() public pure returns (uint256) {
        // Returning 0 directly makes the compiler emit PUSH0
        return 0;
    }
}

/*

forge script script/Counter.s.sol:CounterScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 \
  --legacy \
  --chain-id $1337

forge create src/Push0Test.sol:Push0Test \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 \
  --broadcast

  cast call 0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e "testPush0()(uint256)" --rpc-url http://127.0.0.1:8545

  cast disassemble 0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e -- --rpc-url http://127.0.0.1:8545

  cast code 0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e --rpc-url http://127.0.0.1:8545

  cast da 0x60808060405260043610156011575f80fd5b5f3560e01c6351dca0a5146023575f80fd5b346039575f366003190112603957805f60209252f35b5f80fdfea26469706673582212208d74fa0017e6fe9a4623e627ec801a1d9f1d1ea2e8ea8e3ebaccf28c8d56d75b64736f6c634300081e0033


  forge create src/Push0Test.sol:Push0Test \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63
  --broadcast

*/

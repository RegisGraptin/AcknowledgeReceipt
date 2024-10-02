// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {AcknowledgeReceipt} from "../src/AcknowledgeReceipt.sol";

contract AcknowledgeReceiptScript is Script {
    AcknowledgeReceipt public acknowledgeReceipt;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        acknowledgeReceipt = new AcknowledgeReceipt();

        vm.stopBroadcast();
    }
}

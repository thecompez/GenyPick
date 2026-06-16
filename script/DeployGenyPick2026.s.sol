// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {GenyPick2026} from "../contracts/GenyPick2026.sol";

contract DeployGenyPick2026 is Script {
    function run() external returns (GenyPick2026 deployed) {
        address treasury = vm.envAddress("TREASURY");
        uint256 deadline = vm.envUint("SUBMISSION_DEADLINE");

        vm.startBroadcast();
        deployed = new GenyPick2026(treasury, deadline);
        vm.stopBroadcast();
    }
}

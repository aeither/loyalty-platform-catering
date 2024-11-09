// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {LoyaltyToken} from "../src/RestaurantLoyalty.sol";
import {RestaurantLoyalty} from "../src/RestaurantLoyalty.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy LoyaltyToken first
        LoyaltyToken loyaltyToken = new LoyaltyToken();
        console.log("LoyaltyToken deployed at:", address(loyaltyToken));

        // Deploy RestaurantLoyalty with the token address
        RestaurantLoyalty restaurantLoyalty = new RestaurantLoyalty(address(loyaltyToken));
        console.log("RestaurantLoyalty deployed at:", address(restaurantLoyalty));

        // Optional: Transfer ownership of LoyaltyToken to RestaurantLoyalty
        loyaltyToken.transferOwnership(address(restaurantLoyalty));
        console.log("LoyaltyToken ownership transferred to RestaurantLoyalty");

        vm.stopBroadcast();
    }
}
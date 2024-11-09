// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RestaurantLoyalty.sol";

contract RestaurantLoyaltyTest is Test {
    RestaurantLoyalty public loyalty;
    LoyaltyToken public token;

    address public owner;
    address public restaurant1;
    address public restaurant2;
    address public customer1;
    address public customer2;
    address public referrer;

    function setUp() public {  // Added override keyword here
        owner = address(this);
        restaurant1 = address(0x123);
        restaurant2 = address(0x124);
        customer1 = address(0x125);
        customer2 = address(0x126);
        referrer = address(0x127);

        // Deploy contracts
        token = new LoyaltyToken();
        loyalty = new RestaurantLoyalty(address(token));

        // Transfer ownership of token to loyalty contract
        token.transferOwnership(address(loyalty));

        // Fund accounts for testing
        vm.deal(restaurant1, 100 ether);
        vm.deal(restaurant2, 100 ether);
        vm.deal(customer1, 100 ether);
        vm.deal(customer2, 100 ether);
        vm.deal(referrer, 100 ether);
    }

    // Restaurant Registration Tests
    function testRestaurantRegistration() public {
        vm.startPrank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        (string memory name, address owner, bool isActive, uint256 registeredAt) = loyalty.restaurants(1);
        
        assertEq(name, "Restaurant One");
        assertEq(owner, restaurant1);
        assertTrue(isActive);
        assertGt(registeredAt, 0);
        vm.stopPrank();
    }

    function testFailRestaurantRegistrationEmptyName() public {
        vm.prank(restaurant1);
        loyalty.registerRestaurant("");
    }

    // Customer Registration Tests
    function testCustomerRegistration() public {
        vm.startPrank(customer1);
        loyalty.registerCustomer(referrer);
        
        (address wallet, address customerReferrer, , , , bool isActive) = loyalty.customers(customer1);
        
        assertEq(wallet, customer1);
        assertEq(customerReferrer, referrer);
        assertTrue(isActive);
        vm.stopPrank();
    }

    function testFailCustomerRegistrationDuplicate() public {
        vm.startPrank(customer1);
        loyalty.registerCustomer(referrer);
        loyalty.registerCustomer(referrer); // Should fail
        vm.stopPrank();
    }

    function testFailSelfReferral() public {
        vm.prank(customer1);
        loyalty.registerCustomer(customer1);
    }

    // Dining Activity Tests
    function testRecordDining() public {
        // Setup
        vm.prank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        vm.prank(customer1);
        loyalty.registerCustomer(referrer);

        // Record dining
        vm.prank(restaurant1);
        loyalty.recordDining(1, customer1, 100); // $100 spend

        // Verify points
        (, , , uint256 totalPoints, uint256 currentPoints,) = loyalty.customers(customer1);
        assertEq(currentPoints, 100 * loyalty.POINTS_MULTIPLIER());
        assertEq(totalPoints, 100 * loyalty.POINTS_MULTIPLIER());
    }

    function testReferralBonus() public {
        // Setup
        vm.prank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        vm.prank(referrer);
        loyalty.registerCustomer(address(0));
        
        vm.prank(customer1);
        loyalty.registerCustomer(referrer);

        // Record dining
        vm.prank(restaurant1);
        loyalty.recordDining(1, customer1, 100); // $100 spend

        // Verify referral bonus
        (, , , , uint256 referrerPoints,) = loyalty.customers(referrer);
        uint256 expectedBonus = (100 * loyalty.POINTS_MULTIPLIER() * loyalty.REFERRAL_BONUS_PERCENTAGE()) / 100;
        assertEq(referrerPoints, expectedBonus);
    }

    // Reward Claiming Tests
    function testClaimRewards() public {
        // Setup
        vm.prank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        vm.prank(customer1);
        loyalty.registerCustomer(address(0));

        // Record dining
        vm.prank(restaurant1);
        loyalty.recordDining(1, customer1, 100); // $100 spend

        // Claim rewards
        vm.prank(customer1);
        loyalty.claimRewards();

        // Verify points reset and tokens received
        (, , , , uint256 currentPoints,) = loyalty.customers(customer1);
        assertEq(currentPoints, 0);
        
        uint256 expectedTokens = (100 * loyalty.POINTS_MULTIPLIER()) / loyalty.TOKEN_CONVERSION_RATE();
        assertEq(token.balanceOf(customer1), expectedTokens);
    }

    function testFailClaimWithNoPoints() public {
        vm.prank(customer1);
        loyalty.registerCustomer(address(0));

        vm.prank(customer1);
        loyalty.claimRewards();
    }

    // View Function Tests
    function testGetRestaurantCustomers() public {
        // Setup
        vm.prank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        vm.prank(customer1);
        loyalty.registerCustomer(address(0));

        // Record dining
        vm.prank(restaurant1);
        loyalty.recordDining(1, customer1, 100);

        RestaurantLoyalty.DiningActivity[] memory activities = loyalty.getRestaurantCustomers(1);
        assertEq(activities.length, 1);
        assertEq(activities[0].customer, customer1);
        assertEq(activities[0].amount, 100);
    }

    function testGetCustomerDiningHistory() public {
        // Setup
        vm.prank(restaurant1);
        loyalty.registerRestaurant("Restaurant One");
        
        vm.prank(customer1);
        loyalty.registerCustomer(address(0));

        // Record dining
        vm.prank(restaurant1);
        loyalty.recordDining(1, customer1, 100);

        uint256[] memory history = loyalty.getCustomerDiningHistory(customer1);
        assertEq(history.length, 1);
        assertEq(history[0], 1);
    }

    // Admin Function Tests
    function testSetLoyaltyToken() public {
        LoyaltyToken newToken = new LoyaltyToken();
        loyalty.setLoyaltyToken(address(newToken));
        assertEq(address(loyalty.loyaltyToken()), address(newToken));
    }

    function testFailSetLoyaltyTokenNonOwner() public {
        LoyaltyToken newToken = new LoyaltyToken();
        vm.prank(customer1);
        loyalty.setLoyaltyToken(address(newToken));
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoyaltyToken is ERC20, Ownable {
    constructor() ERC20("Restaurant Loyalty Token", "RLT") Ownable(msg.sender) {
        // Initial supply to contract deployer/owner
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// Main Loyalty Platform Contract
contract RestaurantLoyalty is Ownable {
    LoyaltyToken public loyaltyToken;
    
    struct Restaurant {
        string name;
        address owner;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct Customer {
        address wallet;
        address referrer;
        uint256 registeredAt;
        uint256 totalHistoricalPoints;
        uint256 currentPoints;
        bool isActive;
    }
    
    struct DiningActivity {
        address customer;
        uint256 restaurantId;
        uint256 amount;
        uint256 points;
        uint256 timestamp;
    }

    // Constants
    uint256 public constant POINTS_MULTIPLIER = 100; // 1 USD = 100 points
    uint256 public constant REFERRAL_BONUS_PERCENTAGE = 5; // 5% bonus for referrer
    uint256 public constant TOKEN_CONVERSION_RATE = 100; // 100 points = 1 token

    // Mappings
    mapping(uint256 => Restaurant) public restaurants;
    mapping(address => Customer) public customers;
    mapping(uint256 => DiningActivity[]) public restaurantActivities;
    mapping(address => uint256[]) public customerDiningHistory;
    
    uint256 public nextRestaurantId;
    
    // Events
    event RestaurantRegistered(uint256 indexed restaurantId, string name, address owner);
    event CustomerRegistered(address indexed customer, address referrer);
    event DiningRecorded(address indexed customer, uint256 indexed restaurantId, uint256 amount, uint256 points);
    event RewardsClaimed(address indexed customer, uint256 points, uint256 tokens);

    constructor(address _loyaltyToken) Ownable(msg.sender) {
        loyaltyToken = LoyaltyToken(_loyaltyToken);
        nextRestaurantId = 1;
    }

    // Restaurant Registration
    function registerRestaurant(string memory _name) external {
        require(bytes(_name).length > 0, "Invalid restaurant name");
        
        uint256 restaurantId = nextRestaurantId++;
        restaurants[restaurantId] = Restaurant({
            name: _name,
            owner: msg.sender,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit RestaurantRegistered(restaurantId, _name, msg.sender);
    }

    // Customer Registration
    function registerCustomer(address _referrer) external {
        require(!customers[msg.sender].isActive, "Customer already registered");
        require(_referrer != msg.sender, "Cannot refer yourself");
        
        customers[msg.sender] = Customer({
            wallet: msg.sender,
            referrer: _referrer,
            registeredAt: block.timestamp,
            totalHistoricalPoints: 0,
            currentPoints: 0,
            isActive: true
        });
        
        emit CustomerRegistered(msg.sender, _referrer);
    }

    // Record Dining Activity
    function recordDining(
        uint256 _restaurantId, 
        address _customer, 
        uint256 _amount
    ) external {
        require(restaurants[_restaurantId].isActive, "Restaurant not active");
        require(restaurants[_restaurantId].owner == msg.sender, "Not restaurant owner");
        require(customers[_customer].isActive, "Customer not registered");
        
        uint256 points = calculatePoints(_amount);
        Customer storage customer = customers[_customer];
        
        // Update points
        customer.currentPoints += points;
        customer.totalHistoricalPoints += points;
        
        // Add referral bonus if applicable
        if (customer.referrer != address(0)) {
            uint256 referralBonus = (points * REFERRAL_BONUS_PERCENTAGE) / 100;
            customers[customer.referrer].currentPoints += referralBonus;
            customers[customer.referrer].totalHistoricalPoints += referralBonus;
        }
        
        // Record activity
        DiningActivity memory activity = DiningActivity({
            customer: _customer,
            restaurantId: _restaurantId,
            amount: _amount,
            points: points,
            timestamp: block.timestamp
        });
        
        restaurantActivities[_restaurantId].push(activity);
        customerDiningHistory[_customer].push(_restaurantId);
        
        emit DiningRecorded(_customer, _restaurantId, _amount, points);
    }

    // Claim Rewards
    function claimRewards() external {
        Customer storage customer = customers[msg.sender];
        require(customer.isActive, "Customer not registered");
        require(customer.currentPoints > 0, "No points to claim");
        
        uint256 pointsToClaim = customer.currentPoints;
        uint256 tokensToMint = pointsToClaim / TOKEN_CONVERSION_RATE;
        
        require(tokensToMint > 0, "Not enough points for conversion");
        
        // Reset current points
        customer.currentPoints = 0;
        
        // Mint tokens to customer
        loyaltyToken.mint(msg.sender, tokensToMint);
        
        emit RewardsClaimed(msg.sender, pointsToClaim, tokensToMint);
    }

    // View Functions
    function getRestaurantCustomers(uint256 _restaurantId) external view returns (DiningActivity[] memory) {
        return restaurantActivities[_restaurantId];
    }

    function getCustomerDiningHistory(address _customer) external view returns (uint256[] memory) {
        return customerDiningHistory[_customer];
    }

    function calculatePoints(uint256 _amount) public pure returns (uint256) {
        return _amount * POINTS_MULTIPLIER;
    }

    function setLoyaltyToken(address _newToken) external onlyOwner {
        loyaltyToken = LoyaltyToken(_newToken);
    }
}
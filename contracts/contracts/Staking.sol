pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Staking is ReentrancyGuard {

    struct Stake {
        uint256 id;
        uint256 amount;
        uint256 stakeStartBlock;
        address staker;
    }

    address[] public stakeholders;
    Stake[] public currentStakes;
    
    address public stakingToken;
    address public rewardToken;

    uint256 public lockingPeriod;

    uint256 public immutable BLOCKS_MINED_PER_DAY;

    mapping(address => uint256) public stakerBalance; 
    // mapping(address => mapping(uint256 => Stake)) public stakersStakes;
    mapping(address => uint256) public userCurrentStakes;
    mapping(address => uint256) public rewardsAccumulated;
    mapping(address => bool) public autoCompound;

    event AutoCompoundSet(address user, bool authorized);

    constructor(address _stakingToken, address _rewardToken, uint256 _BLOCKS_MINED_PER_DAY) {
        require(_stakingToken != address(0), "Staking token cannot be address 0");
        require(_rewardToken != address(0), "Reward token cannot be address 0");
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        lockingPeriod = 100;
        BLOCKS_MINED_PER_DAY = _BLOCKS_MINED_PER_DAY;
    }

    function getBalance(address staker) external view returns(uint256 balance){
        return stakerBalance[staker];
    }

    function getActiveStakeholders() external view returns(uint256 balance){
        return stakeholders.length;
    }

    function getBalanceWithRewards(address staker) external view returns(uint256 balance){
        uint256 startingBlock = 0;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(currentStakes[index].staker == staker) {
                startingBlock = currentStakes[index].stakeStartBlock;
            }
        }
        uint256 stakerBalance = stakerBalance[staker];
        uint256 rewards = calculateRewards(startingBlock, block.number, stakerBalance);
        console.log(rewards);
        uint256 totalBalance = stakerBalance + rewards;
        return totalBalance;
    }

    /**
    * @notice A method to check if an address is a stakeholder.
    * @param _user The address to verify.
    * @return bool, uint256 Whether the address is a stakeholder and if so its position in the stakeholders array.
    */
    function isStakeholder(address _user) public view returns(bool, uint256){
        for (uint256 index = 0; index < stakeholders.length; index++) {
            if (_user == stakeholders[index]) return (true, index);
        }
        return (false, 0);
    }

    /**
    * @notice A method to add a stakeholder.
    * @param _stakeholder The stakeholder to add.
    */
    function addStakeholder(address _stakeholder) internal {
        (bool _isStakeholder, ) = isStakeholder(_stakeholder);
        if(!_isStakeholder) stakeholders.push(_stakeholder);
    }

    /**
    * @notice A method to remove a stakeholder.
    * @param _stakeholder The stakeholder to remove.
    */
    function removeStakeholder(address _stakeholder) internal {
        (bool _isStakeholder, uint256 index) = isStakeholder(_stakeholder);
        if(_isStakeholder) {
            stakeholders[index] = stakeholders[stakeholders.length - 1];
            stakeholders.pop();
        }
    }

    /**
    * @notice A method to retrieve the stake for a stakeholder.
    * @param _stakeholder The stakeholder to retrieve the stake for.
    * @return uint The amount of NLA tokens staked.
    */
    function amountStakedOf(address _stakeholder) public view returns(uint256){
        (bool _isStakeholder, ) = isStakeholder(_stakeholder);
        if(_isStakeholder) return stakerBalance[_stakeholder];
    }

    function totalValueStaked() public view returns(uint256) {
        uint256 _totalValueStaked = 0;
        for (uint256 index = 0; index < stakeholders.length; index++) {
            _totalValueStaked = _totalValueStaked + stakerBalance[stakeholders[index]];
        }
        return _totalValueStaked;
    }

    /**
    * @notice A method to toggle autocompound on and off
    */
    function toggleAutoCompound() external {
        address user = msg.sender;
        autoCompound[user] = !autoCompound[user];

        emit AutoCompoundSet(user, autoCompound[user]);
    }

    function compound() external {
        address staker = msg.sender;
        uint256 amountToCompound = 0;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(currentStakes[index].staker == staker) {
                uint256 rewards = calculateRewards(currentStakes[index].stakeStartBlock, block.number, currentStakes[index].amount);
                amountToCompound = amountToCompound + rewards;
            }
        }
        stakerBalance[staker] += amountToCompound;
    }

    /**
    * @notice A method for a stakeholder to stake tokens.
    * @param amount The amount of tokens to stake.
    */
    function stakeTokens(uint256 amount) external nonReentrant {
        require(amount <= IERC20(rewardToken).totalSupply() / 3, "Max staked amount cannot be bigger than 33% of total supply");
        require(amount > 0, "Cannot stake 0 tokens");
        require(IERC20(stakingToken).balanceOf(msg.sender) >= amount, "Not enough balance");
        address staker = msg.sender;
        if(stakerBalance[staker] == 0) addStakeholder(staker);
        stakerBalance[staker] = stakerBalance[staker] + amount;
        userCurrentStakes[staker] = userCurrentStakes[staker] + 1;
        currentStakes.push(Stake(userCurrentStakes[staker] + 1, amount, block.number, staker));
        IERC20(stakingToken).transferFrom(staker, address(this), amount);
    }

    /**
    * @notice A method for a stakeholder to withdraw staked tokens.
    * @param amount The amount of tokens to withdraw.
    */
    function withdrawStakedTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0 tokens");
        address staker = msg.sender;
        uint256 stakerBalanceBefore = stakerBalance[staker];
        uint256 rewardAmount = 0;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(block.number - currentStakes[index].stakeStartBlock >= lockingPeriod) { // minimum lock time period is 100 blocks
                stakerBalance[staker] = stakerBalance[staker] - amount;
                rewardAmount = calculateRewards(currentStakes[index].stakeStartBlock, block.number, amount);
                delete currentStakes[index];
                break;
            }
        }
        // check if user is still staker or if he withdrew the entire balance of staked tokens
        bool isStillStaker = false;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(currentStakes[index].staker == staker) {
                isStillStaker = true;
                break;
            }
        }
        if (isStillStaker == false) removeStakeholder(staker);
        uint256 stakerBalanceAfter = stakerBalance[staker];
        require(stakerBalanceAfter < stakerBalanceBefore, "Withdraw not allowed yet");
        uint256 amountToBurn = burn(amount);
        // if withdraw amount is bigger than the balance of the contract then send everything left to the user
        if(IERC20(stakingToken).balanceOf(address(this)) <= amount + (rewardAmount - amountToBurn)) {
            IERC20(stakingToken).transfer(staker, IERC20(stakingToken).balanceOf(address(this)));
        } else {
            IERC20(stakingToken).transfer(staker, amount + (rewardAmount - amountToBurn));
        }
    }

    /**
    * @notice A method for a stakeholder to withdraw all staked tokens.
    */
    function withdrawAllStakedTokens() external nonReentrant {
        address staker = msg.sender;
        uint256 stakerBalanceBefore = stakerBalance[staker];
        uint256 rewardAmount = 0;
        uint256 availableToWithdraw;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(block.number - currentStakes[index].stakeStartBlock > 1) {
                uint256 reward = calculateRewards(currentStakes[index].stakeStartBlock, block.number, availableToWithdraw);
                availableToWithdraw = availableToWithdraw + currentStakes[index].amount + reward;
                stakerBalance[staker] = stakerBalance[staker] - currentStakes[index].amount;
                delete currentStakes[index];
            }
        }
        bool isStillStaker = false;
        for (uint256 index = 0; index < currentStakes.length; index++) {
            if(currentStakes[index].staker == staker) {
                isStillStaker = true;
                break;
            }
        }
        if (isStillStaker == false) removeStakeholder(staker);
        uint256 stakerBalanceAfter = stakerBalance[staker];
        require(stakerBalanceAfter < stakerBalanceBefore, "Withdraw not allowed yet");
        uint256 amountToBurn = burn(availableToWithdraw);
        // if withdraw amount is bigger than the balance of the contract then send everything left to the user
        if(IERC20(stakingToken).balanceOf(address(this)) <= availableToWithdraw + (rewardAmount - amountToBurn)) {
            IERC20(stakingToken).transfer(staker, IERC20(stakingToken).balanceOf(address(this)));
        } else {
            IERC20(stakingToken).transfer(staker, availableToWithdraw + (rewardAmount - amountToBurn));
        }
    }

    function calculateRewards(uint256 stakeStartBlock, uint256 stakeEndBlock, uint256 amountStaked) public view returns(uint256) {
        uint256 time = (stakeEndBlock - stakeStartBlock) * 10**18;
        uint256 rate = 28640;
        uint256 timeRate = time / rate;
        uint256 rewards = (amountStaked * timeRate) / 10**18;
        return rewards;
    }

    function getRewardsPerDay(address staker) public view returns(uint256) {
        (bool isStakeholder, ) = isStakeholder(staker);
        require(isStakeholder, "not a staker");
        uint256 stakedAmount = stakerBalance[staker];
        uint256 rate = 28640;
        uint256 timeRate = BLOCKS_MINED_PER_DAY * 10**18 / rate;
        console.log(stakedAmount);
        console.log(timeRate);
        uint256 rewardsPerDay = (stakedAmount * timeRate) / 10**18; // 100 blocks mined per day
        return rewardsPerDay;
    }

    function burn(uint256 amount) public returns(uint256){
        uint256 amountToBurn = amount / 100 * 2;
        IERC20(stakingToken).transfer(0x000000000000000000000000000000000000dEaD, amountToBurn);
        return amountToBurn;
    }

}
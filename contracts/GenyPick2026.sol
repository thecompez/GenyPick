// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GenyPick2026 is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant CARD_PRICE = 256 ether;
    uint8 public constant MAX_ATTEMPTS = 32;
    uint16 public constant MIN_TEAM_ID = 1;
    uint16 public constant MAX_TEAM_ID = 48;
    uint16 public constant MAX_SCORE = 480;
    address public constant GENY_TOKEN = 0x2a3d6f8c1fc4AcDcf3A75d19b445bae02F03676B;

    struct Prediction {
        uint16 champion;
        uint16 runnerUp;
        uint16 thirdPlace;
        uint16 fourthPlace;
        uint256 entryAmount;
        uint256 timestamp;
        uint8 attemptNumber;
        bool active;
        uint256 invalidatedAt;
    }

    struct FinalResult {
        uint16 champion;
        uint16 runnerUp;
        uint16 thirdPlace;
        uint16 fourthPlace;
        bool isSet;
    }

    IERC20 public immutable geny;
    address public treasury;
    uint256 public deadline;
    uint256 public totalPool;
    uint256 public rewardPool;
    uint256 public treasuryPool;
    uint256 public totalClaimed;
    bool public finalized;
    bool public submissionsLocked;
    bytes32 public merkleRoot;

    mapping(address => Prediction) private activePredictions;
    mapping(address => Prediction[]) private predictionHistory;
    mapping(address => uint8) public attemptCount;
    mapping(address => uint256) public totalPaidByUser;
    mapping(address => bool) private claimed;

    FinalResult public finalResult;

    event PredictionSubmitted(
        address indexed user,
        uint8 indexed attemptNumber,
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace,
        uint256 entryAmount,
        uint256 timestamp
    );
    event PredictionRevised(
        address indexed user,
        uint8 indexed previousAttemptNumber,
        uint8 indexed newAttemptNumber,
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace,
        uint256 entryAmount,
        uint256 timestamp
    );
    event PredictionInvalidated(address indexed user, uint8 indexed attemptNumber, uint256 timestamp);
    event SubmissionsLocked(address indexed owner, uint256 timestamp);
    event FinalResultSet(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace
    );
    event DeadlineUpdated(uint256 oldDeadline, uint256 newDeadline);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PoolFinalized(uint256 totalPool, uint256 rewardPool, uint256 treasuryPool);
    event TreasuryWithdrawn(address indexed treasury, uint256 amount);
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address initialTreasury, uint256 initialDeadline) Ownable(msg.sender) {
        require(initialTreasury != address(0), "Invalid treasury");
        require(initialDeadline > block.timestamp, "Invalid deadline");
        geny = IERC20(GENY_TOKEN);
        treasury = initialTreasury;
        deadline = initialDeadline;
    }

    function submitPrediction(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace,
        uint256 entryAmount
    ) external nonReentrant whenNotPaused {
        _submitOrRevisePrediction(champion, runnerUp, thirdPlace, fourthPlace, entryAmount);
    }

    function submitOrRevisePrediction(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace,
        uint256 entryAmount
    ) external nonReentrant whenNotPaused {
        _submitOrRevisePrediction(champion, runnerUp, thirdPlace, fourthPlace, entryAmount);
    }

    function _submitOrRevisePrediction(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace,
        uint256 entryAmount
    ) private {
        require(!submissionsLocked, "Submissions locked");
        require(block.timestamp < deadline, "Submissions closed");
        require(!finalized, "Pool finalized");
        require(attemptCount[msg.sender] < MAX_ATTEMPTS, "Max attempts reached");
        require(entryAmount == CARD_PRICE, "Card price is 256 GENY");
        require(validTeamId(champion), "Invalid champion");
        require(validTeamId(runnerUp), "Invalid runner-up");
        require(validTeamId(thirdPlace), "Invalid third place");
        require(validTeamId(fourthPlace), "Invalid fourth place");
        require(allTeamsUnique(champion, runnerUp, thirdPlace, fourthPlace), "Duplicate team");

        geny.safeTransferFrom(msg.sender, address(this), entryAmount);

        uint8 previousAttemptNumber = attemptCount[msg.sender];
        if (previousAttemptNumber > 0) {
            Prediction storage previousActive = activePredictions[msg.sender];
            previousActive.active = false;
            previousActive.invalidatedAt = block.timestamp;
            Prediction storage previousHistory = predictionHistory[msg.sender][previousAttemptNumber - 1];
            previousHistory.active = false;
            previousHistory.invalidatedAt = block.timestamp;
            emit PredictionInvalidated(msg.sender, previousAttemptNumber, block.timestamp);
        }

        uint8 newAttemptNumber = previousAttemptNumber + 1;
        Prediction memory prediction = Prediction({
            champion: champion,
            runnerUp: runnerUp,
            thirdPlace: thirdPlace,
            fourthPlace: fourthPlace,
            entryAmount: entryAmount,
            timestamp: block.timestamp,
            attemptNumber: newAttemptNumber,
            active: true,
            invalidatedAt: 0
        });

        activePredictions[msg.sender] = prediction;
        predictionHistory[msg.sender].push(prediction);
        attemptCount[msg.sender] = newAttemptNumber;
        totalPaidByUser[msg.sender] += entryAmount;
        totalPool += entryAmount;

        emit PredictionSubmitted(
            msg.sender,
            newAttemptNumber,
            champion,
            runnerUp,
            thirdPlace,
            fourthPlace,
            entryAmount,
            block.timestamp
        );
        if (previousAttemptNumber > 0) {
            emit PredictionRevised(
                msg.sender,
                previousAttemptNumber,
                newAttemptNumber,
                champion,
                runnerUp,
                thirdPlace,
                fourthPlace,
                entryAmount,
                block.timestamp
            );
        }
    }

    function hasSubmitted(address user) external view returns (bool) {
        return attemptCount[user] > 0;
    }

    function getPrediction(address user) external view returns (Prediction memory) {
        return getActivePrediction(user);
    }

    function getActivePrediction(address user) public view returns (Prediction memory) {
        require(attemptCount[user] > 0, "No prediction");
        return activePredictions[user];
    }

    function getPredictionHistoryLength(address user) external view returns (uint256) {
        return predictionHistory[user].length;
    }

    function getPredictionHistory(address user, uint256 index) external view returns (Prediction memory) {
        require(index < predictionHistory[user].length, "Invalid history index");
        return predictionHistory[user][index];
    }

    function calculateScore(address user) external view returns (uint16) {
        require(attemptCount[user] > 0, "No prediction");
        Prediction memory prediction = activePredictions[user];
        return calculateScoreForPrediction(
            prediction.champion,
            prediction.runnerUp,
            prediction.thirdPlace,
            prediction.fourthPlace
        );
    }

    function calculateScoreForPrediction(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace
    ) public view returns (uint16) {
        require(finalResult.isSet, "Final result not set");
        uint16 score = 0;
        score += _scorePosition(champion, finalResult.champion, 256);
        score += _scorePosition(runnerUp, finalResult.runnerUp, 128);
        score += _scorePosition(thirdPlace, finalResult.thirdPlace, 64);
        score += _scorePosition(fourthPlace, finalResult.fourthPlace, 32);
        return score;
    }

    function setFinalResult(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace
    ) external onlyOwner {
        require(!finalized, "Pool finalized");
        require(validTeamId(champion), "Invalid champion");
        require(validTeamId(runnerUp), "Invalid runner-up");
        require(validTeamId(thirdPlace), "Invalid third place");
        require(validTeamId(fourthPlace), "Invalid fourth place");
        require(allTeamsUnique(champion, runnerUp, thirdPlace, fourthPlace), "Duplicate team");
        finalResult = FinalResult({
            champion: champion,
            runnerUp: runnerUp,
            thirdPlace: thirdPlace,
            fourthPlace: fourthPlace,
            isSet: true
        });
        emit FinalResultSet(champion, runnerUp, thirdPlace, fourthPlace);
    }

    function finalizePool() external onlyOwner {
        require(!finalized, "Already finalized");
        require(finalResult.isSet, "Final result not set");
        finalized = true;
        rewardPool = (totalPool * 75) / 100;
        treasuryPool = totalPool - rewardPool;
        emit PoolFinalized(totalPool, rewardPool, treasuryPool);
    }

    function lockSubmissions() external onlyOwner {
        require(!submissionsLocked, "Submissions already locked");
        require(!finalized, "Pool finalized");
        submissionsLocked = true;
        emit SubmissionsLocked(msg.sender, block.timestamp);
    }

    function setDeadline(uint256 newDeadline) external onlyOwner {
        require(!submissionsLocked, "Submissions locked");
        require(!finalized, "Pool finalized");
        require(newDeadline > block.timestamp, "Invalid deadline");
        uint256 oldDeadline = deadline;
        deadline = newDeadline;
        emit DeadlineUpdated(oldDeadline, newDeadline);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawTreasury() external onlyOwner {
        require(finalized, "Pool not finalized");
        uint256 amount = treasuryPool;
        require(amount > 0, "No treasury");
        treasuryPool = 0;
        geny.safeTransfer(treasury, amount);
        emit TreasuryWithdrawn(treasury, amount);
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        require(finalized, "Pool not finalized");
        require(root != bytes32(0), "Invalid root");
        bytes32 oldRoot = merkleRoot;
        merkleRoot = root;
        emit MerkleRootUpdated(oldRoot, root);
    }

    function claimReward(uint256 amount, bytes32[] calldata proof) external nonReentrant {
        require(finalized, "Pool not finalized");
        require(merkleRoot != bytes32(0), "Merkle root not set");
        require(!claimed[msg.sender], "Already claimed");
        require(amount > 0, "Invalid amount");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        require(totalClaimed + amount <= rewardPool, "Reward pool exhausted");

        claimed[msg.sender] = true;
        totalClaimed += amount;
        geny.safeTransfer(msg.sender, amount);
        emit RewardClaimed(msg.sender, amount);
    }

    function hasClaimed(address user) external view returns (bool) {
        return claimed[user];
    }

    function validTeamId(uint16 teamId) public pure returns (bool) {
        return teamId >= MIN_TEAM_ID && teamId <= MAX_TEAM_ID;
    }

    function allTeamsUnique(
        uint16 champion,
        uint16 runnerUp,
        uint16 thirdPlace,
        uint16 fourthPlace
    ) public pure returns (bool) {
        return champion != runnerUp
            && champion != thirdPlace
            && champion != fourthPlace
            && runnerUp != thirdPlace
            && runnerUp != fourthPlace
            && thirdPlace != fourthPlace;
    }

    function _scorePosition(uint16 pickedTeam, uint16 exactTeam, uint16 exactPoints) private view returns (uint16) {
        if (pickedTeam == exactTeam) {
            return exactPoints;
        }
        if (_isInFinalTopFour(pickedTeam)) {
            return 16;
        }
        return 0;
    }

    function _isInFinalTopFour(uint16 teamId) private view returns (bool) {
        return teamId == finalResult.champion
            || teamId == finalResult.runnerUp
            || teamId == finalResult.thirdPlace
            || teamId == finalResult.fourthPlace;
    }
}

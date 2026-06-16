// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {GenyPick2026} from "../contracts/GenyPick2026.sol";
import {MockGeny} from "./MockGeny.sol";

contract GenyPick2026Test is Test {
    address internal constant GENY_TOKEN = 0x2a3d6f8c1fc4AcDcf3A75d19b445bae02F03676B;

    GenyPick2026 internal pool;
    MockGeny internal geny;
    address internal treasury = address(0xA11CE);
    address internal user = address(0xB0B);
    address internal userTwo = address(0xC0DE);
    uint256 internal deadline;

    function setUp() public {
        MockGeny implementation = new MockGeny();
        vm.etch(GENY_TOKEN, address(implementation).code);
        geny = MockGeny(GENY_TOKEN);
        geny.initialize();

        deadline = block.timestamp + 30 days;
        pool = new GenyPick2026(treasury, deadline);

        geny.mint(user, 20000 ether);
        geny.mint(userTwo, 20000 ether);
        vm.prank(user);
        geny.approve(address(pool), type(uint256).max);
        vm.prank(userTwo);
        geny.approve(address(pool), type(uint256).max);
    }

    function testSuccessfulPredictionWith256Geny() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);

        assertTrue(pool.hasSubmitted(user));
        assertEq(pool.totalPool(), 256 ether);
        assertEq(pool.attemptCount(user), 1);
        assertEq(pool.totalPaidByUser(user), 256 ether);
        GenyPick2026.Prediction memory prediction = pool.getPrediction(user);
        assertEq(prediction.champion, 1);
        assertEq(prediction.entryAmount, 256 ether);
        assertEq(prediction.attemptNumber, 1);
        assertTrue(prediction.active);
    }

    function testCardPriceConstantIs256Geny() public view {
        assertEq(pool.CARD_PRICE(), 256 ether);
    }

    function testRejectEntryBelow256Geny() public {
        vm.prank(user);
        vm.expectRevert(bytes("Card price is 256 GENY"));
        pool.submitPrediction(1, 18, 7, 41, 255 ether);
    }

    function testRejectEntryAbove256Geny() public {
        vm.prank(user);
        vm.expectRevert(bytes("Card price is 256 GENY"));
        pool.submitPrediction(1, 18, 7, 41, 257 ether);
    }

    function testSecondAttemptSucceedsAndInvalidatesFirst() public {
        vm.startPrank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.submitPrediction(18, 1, 7, 34, 256 ether);
        vm.stopPrank();

        assertEq(pool.attemptCount(user), 2);
        assertEq(pool.totalPool(), 512 ether);
        assertEq(pool.totalPaidByUser(user), 512 ether);

        GenyPick2026.Prediction memory active = pool.getActivePrediction(user);
        assertEq(active.champion, 18);
        assertEq(active.attemptNumber, 2);
        assertTrue(active.active);

        GenyPick2026.Prediction memory oldPrediction = pool.getPredictionHistory(user, 0);
        assertEq(oldPrediction.attemptNumber, 1);
        assertFalse(oldPrediction.active);
        assertGt(oldPrediction.invalidatedAt, 0);
        assertEq(pool.getPredictionHistoryLength(user), 2);
    }

    function testMax32AttemptsAnd33rdReverts() public {
        vm.startPrank(user);
        for (uint8 i = 0; i < pool.MAX_ATTEMPTS(); i++) {
            pool.submitPrediction(1, 18, 7, 41, 256 ether);
        }
        vm.expectRevert(bytes("Max attempts reached"));
        pool.submitPrediction(18, 1, 7, 34, 256 ether);
        vm.stopPrank();

        assertEq(pool.attemptCount(user), pool.MAX_ATTEMPTS());
        assertEq(pool.totalPool(), uint256(pool.MAX_ATTEMPTS()) * 256 ether);
    }

    function testRejectDuplicateTeam() public {
        vm.prank(user);
        vm.expectRevert(bytes("Duplicate team"));
        pool.submitPrediction(1, 1, 7, 41, 256 ether);
    }

    function testRejectInvalidTeamId() public {
        vm.prank(user);
        vm.expectRevert(bytes("Invalid champion"));
        pool.submitPrediction(0, 18, 7, 41, 256 ether);

        vm.prank(user);
        vm.expectRevert(bytes("Invalid fourth place"));
        pool.submitPrediction(1, 18, 7, 49, 256 ether);
    }

    function testRejectAfterDeadline() public {
        vm.warp(deadline);
        vm.prank(user);
        vm.expectRevert(bytes("Submissions closed"));
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
    }

    function testRejectWhenPaused() public {
        pool.pause();
        vm.prank(user);
        vm.expectRevert();
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
    }

    function testRejectAfterManualLock() public {
        pool.lockSubmissions();
        vm.prank(user);
        vm.expectRevert(bytes("Submissions locked"));
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
    }

    function testLockSubmissionsCannotBeCalledTwice() public {
        pool.lockSubmissions();
        vm.expectRevert(bytes("Submissions already locked"));
        pool.lockSubmissions();
    }

    function testSetDeadlineWorksBeforeLockAndRevertsAfterLock() public {
        pool.setDeadline(block.timestamp + 60 days);
        assertEq(pool.deadline(), block.timestamp + 60 days);
        pool.lockSubmissions();
        vm.expectRevert(bytes("Submissions locked"));
        pool.setDeadline(block.timestamp + 90 days);
    }

    function testRejectInsufficientAllowance() public {
        address noAllowanceUser = address(0xF00D);
        geny.mint(noAllowanceUser, 256 ether);
        vm.prank(noAllowanceUser);
        vm.expectRevert();
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
    }

    function testRejectInsufficientBalance() public {
        address emptyUser = address(0xBAD);
        vm.prank(emptyUser);
        geny.approve(address(pool), 256 ether);
        vm.prank(emptyUser);
        vm.expectRevert();
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
    }

    function testScoreCalculationExact480() public {
        vm.prank(user);
        pool.submitPrediction(18, 1, 7, 34, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);

        assertEq(pool.calculateScore(user), 480);
        assertEq(pool.calculateScoreForPrediction(18, 1, 7, 34), pool.MAX_SCORE());
    }

    function testScoreCalculationWithWrongPositionTopFourTeams() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);

        assertEq(pool.calculateScore(user), 96);
    }

    function testExactMatchDoesNotAlsoGetWrongPositionPoints() public {
        vm.prank(user);
        pool.submitPrediction(18, 2, 3, 4, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);

        assertEq(pool.calculateScore(user), 256);
    }

    function testAllTopFourCorrectButWrongPositionsScore64() public {
        vm.prank(user);
        pool.submitPrediction(1, 7, 34, 18, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);

        assertEq(pool.calculateScore(user), 64);
    }

    function testFinalizePoolSplitsSeventyFiveTwentyFive() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        assertEq(pool.rewardPool(), 192 ether);
        assertEq(pool.treasuryPool(), 64 ether);
    }

    function testSetDeadlineRevertsAfterFinalization() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        vm.expectRevert(bytes("Pool finalized"));
        pool.setDeadline(block.timestamp + 90 days);
    }

    function testFinalResultAndFinalizeWorkAfterLock() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.lockSubmissions();

        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        assertTrue(pool.finalized());
        assertEq(pool.rewardPool(), 192 ether);
    }

    function testFinalResultAndFinalizeWorkAfterDeadline() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        vm.warp(deadline);

        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        assertTrue(pool.finalized());
    }

    function testNonOwnerCannotSetResult() public {
        vm.prank(user);
        vm.expectRevert();
        pool.setFinalResult(18, 1, 7, 34);
    }

    function testNonOwnerCannotWithdrawTreasury() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        vm.prank(user);
        vm.expectRevert();
        pool.withdrawTreasury();
    }

    function testOwnerWithdrawsTreasuryAfterFinalize() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        pool.withdrawTreasury();
        assertEq(geny.balanceOf(treasury), 64 ether);
        assertEq(pool.treasuryPool(), 0);
    }

    function testCannotChangeFinalResultAfterFinalize() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        vm.expectRevert(bytes("Pool finalized"));
        pool.setFinalResult(1, 18, 7, 41);
    }

    function testMerkleRewardClaim() public {
        vm.prank(user);
        pool.submitPrediction(18, 1, 7, 34, 256 ether);
        pool.lockSubmissions();
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        uint256 rewardAmount = 100 ether;
        bytes32 leaf = keccak256(abi.encodePacked(user, rewardAmount));
        pool.setMerkleRoot(leaf);

        uint256 beforeBalance = geny.balanceOf(user);
        vm.prank(user);
        pool.claimReward(rewardAmount, new bytes32[](0));

        assertEq(geny.balanceOf(user), beforeBalance + rewardAmount);
        assertTrue(pool.hasClaimed(user));
        assertEq(pool.totalClaimed(), rewardAmount);
    }

    function testWithdrawTreasuryNotBlockedByLock() public {
        vm.prank(user);
        pool.submitPrediction(1, 18, 7, 41, 256 ether);
        pool.lockSubmissions();
        pool.setFinalResult(18, 1, 7, 34);
        pool.finalizePool();

        pool.withdrawTreasury();

        assertEq(geny.balanceOf(treasury), 64 ether);
    }
}

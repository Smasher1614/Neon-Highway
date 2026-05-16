// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RacingGame — Base L2 on-chain racing game contract
/// @notice All functions require 0.1 ETH. Builder code is embedded in every tx.
contract RacingGame {
    address public owner;
    uint256 public constant GAME_FEE = 0.00001 ether;

    struct PlayerScore {
        address player;
        string username;
        uint256 score;
        uint256 timestamp;
    }

    PlayerScore[] private _leaderboard;
    mapping(address => uint256) public lastCheckIn;
    mapping(address => uint256) public bestScore;
    mapping(address => uint256) public checkInBonus;

    event GameStarted(
        address indexed player,
        string builderCode,
        string encodedString,
        uint256 timestamp
    );
    event CameraSwitched(
        address indexed player,
        string newView,
        string builderCode,
        string encodedString
    );
    event CheckedIn(
        address indexed player,
        uint256 bonusPoints,
        string builderCode,
        string encodedString,
        uint256 timestamp
    );
    event ScoreSubmitted(
        address indexed player,
        string username,
        uint256 score,
        string builderCode,
        string encodedString
    );

    modifier requiresFee() {
        require(msg.value == GAME_FEE, "Requires exactly 0.1 ETH");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Pay 0.1 ETH to start a game session on-chain
    function startGame(
        string calldata builderCode,
        string calldata encodedString
    ) external payable requiresFee {
        emit GameStarted(msg.sender, builderCode, encodedString, block.timestamp);
    }

    /// @notice Pay 0.1 ETH to switch camera view (top-down ↔ dashboard)
    function switchCamera(
        string calldata newView,
        string calldata builderCode,
        string calldata encodedString
    ) external payable requiresFee {
        emit CameraSwitched(msg.sender, newView, builderCode, encodedString);
    }

    /// @notice Pay 0.1 ETH for daily check-in — grants 10 bonus points; 24-hour cooldown
    function dailyCheckIn(
        string calldata builderCode,
        string calldata encodedString
    ) external payable requiresFee {
        require(
            block.timestamp >= lastCheckIn[msg.sender] + 1 days,
            "Daily check-in cooldown active"
        );
        lastCheckIn[msg.sender] = block.timestamp;
        checkInBonus[msg.sender] += 10;
        emit CheckedIn(msg.sender, 10, builderCode, encodedString, block.timestamp);
    }

    /// @notice Pay 0.1 ETH to submit score to global leaderboard
    function submitScore(
        uint256 score,
        string calldata username,
        string calldata builderCode,
        string calldata encodedString
    ) external payable requiresFee {
        if (score > bestScore[msg.sender]) {
            bestScore[msg.sender] = score;
        }
        _leaderboard.push(
            PlayerScore({
                player: msg.sender,
                username: username,
                score: score,
                timestamp: block.timestamp
            })
        );
        // Bubble the new entry toward the top (simple insertion approach)
        _sortLeaderboard();
        emit ScoreSubmitted(msg.sender, username, score, builderCode, encodedString);
    }

    /// @notice Returns top 10 leaderboard entries
    function getLeaderboard() external view returns (PlayerScore[] memory) {
        uint256 len = _leaderboard.length < 10 ? _leaderboard.length : 10;
        PlayerScore[] memory top = new PlayerScore[](len);
        for (uint256 i = 0; i < len; i++) {
            top[i] = _leaderboard[i];
        }
        return top;
    }

    function _sortLeaderboard() internal {
        uint256 n = _leaderboard.length;
        if (n < 2) return;
        // Bubble the last element up by score
        for (uint256 i = n - 1; i > 0; i--) {
            if (_leaderboard[i].score > _leaderboard[i - 1].score) {
                PlayerScore memory tmp = _leaderboard[i];
                _leaderboard[i] = _leaderboard[i - 1];
                _leaderboard[i - 1] = tmp;
            } else {
                break;
            }
        }
    }

    function getCheckInBonus(address player) external view returns (uint256) {
        return checkInBonus[player];
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}

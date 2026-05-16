// Contract ABI — RacingGame on Base Mainnet
export const RACING_GAME_ABI = [
  {
    name: 'startGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'builderCode', type: 'string' },
      { name: 'encodedString', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'switchCamera',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'newView', type: 'string' },
      { name: 'builderCode', type: 'string' },
      { name: 'encodedString', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'dailyCheckIn',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'builderCode', type: 'string' },
      { name: 'encodedString', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'submitScore',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'score', type: 'uint256' },
      { name: 'username', type: 'string' },
      { name: 'builderCode', type: 'string' },
      { name: 'encodedString', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'getLeaderboard',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'player', type: 'address' },
          { name: 'username', type: 'string' },
          { name: 'score', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'lastCheckIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCheckInBonus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events
  {
    name: 'GameStarted',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'builderCode', type: 'string', indexed: false },
      { name: 'encodedString', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'CameraSwitched',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'newView', type: 'string', indexed: false },
      { name: 'builderCode', type: 'string', indexed: false },
      { name: 'encodedString', type: 'string', indexed: false },
    ],
  },
  {
    name: 'CheckedIn',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'bonusPoints', type: 'uint256', indexed: false },
      { name: 'builderCode', type: 'string', indexed: false },
      { name: 'encodedString', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'ScoreSubmitted',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'username', type: 'string', indexed: false },
      { name: 'score', type: 'uint256', indexed: false },
      { name: 'builderCode', type: 'string', indexed: false },
      { name: 'encodedString', type: 'string', indexed: false },
    ],
  },
] as const;

// ── Builder tracking constants (required in every Base transaction) ──
export const BUILDER_CODE = 'bc_sjkexp2o';
export const ENCODED_BUILDER_STRING = '0x62635f736a6b6578703 26f0b00802180218021 80218021802180218021 80218021v';

// ── Contract address on Base Mainnet ──
// TODO: Replace with actual deployed address after running: npx hardhat ignition deploy --network base
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ── Base Network Details ──
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC = 'https://mainnet.base.org';
export const BASE_EXPLORER = 'https://basescan.org';

export const GAME_FEE_ETH = '0.00001';

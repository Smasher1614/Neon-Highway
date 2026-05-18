import { Attribution } from 'ox/erc8021';

// ── Official Base Builder Code attribution (ERC-8021 / ox) ──
// dataSuffix is appended to every transaction's calldata automatically
export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_2fhmk7s8'],
});

// ── Contract address on Base Mainnet ──
export const CONTRACT_ADDRESS = '0xcd813Ca9620d99f687e230635645ad511648B797' as `0x${string}`;

// ── Base Network Details ──
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC = 'https://mainnet.base.org';
export const BASE_EXPLORER = 'https://basescan.org';

export const GAME_FEE_ETH = '0.00001';

// ── Contract ABI — RacingGame on Base Mainnet ──
// Builder code is now embedded via dataSuffix (ERC-8021), not as function args
export const RACING_GAME_ABI = [
  {
    name: 'startGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'switchCamera',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'newView', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'dailyCheckIn',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'submitScore',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'score', type: 'uint256' },
      { name: 'username', type: 'string' },
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
] as const;

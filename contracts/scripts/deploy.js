import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { readFileSync } from 'fs';

const PRIVATE_KEY = '0xc16f78b49ca345b9048f9c36f5dc167f15ccffa82254a9c3a1b338bbc079b4eb';

const artifact = JSON.parse(readFileSync('./artifacts/contracts/RacingGame.sol/RacingGame.json', 'utf8'));

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

async function deploy() {
  console.log('Deployer address:', account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', Number(balance) / 1e18, 'ETH');

  if (balance === 0n) {
    console.error('ERROR: Wallet has no ETH. Please fund it first.');
    process.exit(1);
  }

  console.log('Deploying RacingGame to Base Mainnet...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log('Deploy tx hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n✅ CONTRACT DEPLOYED SUCCESSFULLY!');
  console.log('Contract address:', receipt.contractAddress);
  console.log('Block:', receipt.blockNumber.toString());
}

deploy().catch(err => { console.error(err); process.exit(1); });

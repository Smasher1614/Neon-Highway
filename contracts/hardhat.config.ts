import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
  },
  networks: {
    base: {
      type: "http",
      url: "https://mainnet.base.org",
      chainId: 8453,
      ...(PRIVATE_KEY.startsWith('0x') ? { accounts: [PRIVATE_KEY] } : {}),
    },
  },
};

export default config;

import { ethers } from "hardhat";
import {Contract, ContractFactory} from "ethers";

async function main() {
  const stakingToken: string = "0xc351De5746211E2B7688D7650A8bF7D91C809c0D";
  const rewardToken: string = "0xc351De5746211E2B7688D7650A8bF7D91C809c0D";
  const blocksMinedPerDay: number = 100;
  const StakingContract: ContractFactory = await ethers.getContractFactory("Staking");
  const staking: Contract = await StakingContract.deploy(stakingToken, rewardToken, blocksMinedPerDay);  

  await staking.deployed();

  console.log(`Staking contract deployed at address ${staking.address}`);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

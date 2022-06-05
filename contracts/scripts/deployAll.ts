import { ethers } from "hardhat";
import {Contract, ContractFactory} from "ethers";

const fs = require('fs');

async function main() {
  const pancakeRouterAddress: string = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  const NalaRouter: ContractFactory = await ethers.getContractFactory("NalaRouter");
  const nalaRouter: Contract = await NalaRouter.deploy(pancakeRouterAddress);  

  await nalaRouter.deployed();

  console.log(`NalaRouter deployed at address ${nalaRouter.address}`);

  const NalaTokenContract: ContractFactory = await ethers.getContractFactory("NalaToken");
  const nalaToken: Contract = await NalaTokenContract.deploy();  

  await nalaToken.deployed();

  console.log(`NalaToken deployed at address ${nalaToken.address}`);

  const stakingToken: string = nalaToken.address;
  const rewardToken: string = nalaToken.address;

  const StakingContract: ContractFactory = await ethers.getContractFactory("Staking");
  const blocksMinedPerDay: number = 100;
  const staking: Contract = await StakingContract.deploy(stakingToken, rewardToken, blocksMinedPerDay);  

  await staking.deployed();

  console.log(`Staking contract deployed at address ${staking.address}`);

  const NFTCollectionContract: ContractFactory = await ethers.getContractFactory("NFTCollection");
  const nftCollection: Contract = await NFTCollectionContract.deploy("EYES", "EYE", "c");  

  await nftCollection.deployed();

  console.log(`Eyes nft contract deployed at address ${nftCollection.address}`);

  const NFTStakingContract: ContractFactory = await ethers.getContractFactory("NFTStaking");
  const nftStaking: Contract = await NFTStakingContract.deploy();  

  await nftStaking.deployed();

  console.log(`NFT staking contract deployed at address ${nftStaking.address}`);

  await nalaToken.addController(nftStaking.address); // allow nftStaking contract to be a controller for the erc20 token
  await nftStaking.addVault(nftCollection.address, nalaToken.address, "Nala-Vault");

  const dataObj = {
    "nalaTokenAddress": nalaToken.address,
    "stakingContract": staking.address,
    "nftCollectionAddress": nftCollection.address,
    "nftStakingContract": nftStaking.address,
    "nalaRouterContract": nalaRouter.address
  }

  const data = JSON.stringify(dataObj);

  fs.writeFile('../webapp/nalaswap/src/utils/contractsAddresses.json', data, (err: any) => {
    if (err) {
        throw err;
    }
    console.log("Contracts addresses data is saved.");
});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

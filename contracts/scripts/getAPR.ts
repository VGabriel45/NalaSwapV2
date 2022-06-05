import { ethers } from "hardhat";
import {Contract, ContractFactory} from "ethers";
import BigNumber from 'bignumber.js'
const nalaTokenABI = require("./ABIS/NalaTokenABI.json")
const nalaRouterABI = require("./ABIS/NalaRouter.json")
import { formatUnits } from '@ethersproject/units';

async function main() {
    const signer = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const nalaTokenAdress: string = "0xA4D285a9B6B1924C6C003dAc8ef49bc4607D684b";
    const wBNBTokenAddress: string = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const pancakeRouterV2 = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", ["function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"], signer);

    const amountsOut = await pancakeRouterV2
    .getAmountsOut(
        ethers.utils.parseEther("1"), 
        [wBNBTokenAddress, nalaTokenAdress]
    )

    const amoutOfNLAFor1BNB: any = formatUnits(amountsOut[1].toString(), 18);
    const nlaPriceInBNB = 1 / amoutOfNLAFor1BNB;

    console.log(nlaPriceInBNB);
    
    const getAPR = (
        stakingTokenPrice: number,
        rewardTokenPrice: number,
        totalStaked: number,
        tokenPerBlock: number,
      ): number => {
        const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(28640)
        console.log(`Anual income from rewards = ${totalRewardPricePerYear.toNumber()}$`);
        const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked)
        const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(10)
        return apr.toNumber()
    }

    const APR = getAPR(nlaPriceInBNB, nlaPriceInBNB, 1000, 0.5);
    console.log(`${APR}%`);
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

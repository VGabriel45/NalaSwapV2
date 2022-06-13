import { ethers } from "hardhat";
import {Contract, ContractFactory} from "ethers";
const nalaTokenABI = require("./ABIS/NalaTokenABI.json")
const nalaRouterABI = require("./ABIS/NalaRouter.json")

async function main() {
    const signer = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const pancakeRouterAddress: string = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const nalaTokenAdress: string = "0xc31df591ad41Bf35cac578822580Cf6188ae7fCE";
    const nalaRouterAddress: string = "0x8DDF02B5bF6203af017b39D99870743446CE4D8b";

    const nalaToken = new ethers.Contract(nalaTokenAdress, nalaTokenABI, signer);
    const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);

    await nalaToken.connect(signer).approve(nalaRouterAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    await nalaRouter.connect(signer).addLiquidityETH(nalaToken.address, ethers.utils.parseEther("50000"), 0, 0, {value: ethers.utils.parseEther("500")});

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

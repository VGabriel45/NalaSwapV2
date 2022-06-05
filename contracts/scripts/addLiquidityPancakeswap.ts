import { ethers } from "hardhat";
import {Contract, ContractFactory} from "ethers";
const nalaTokenABI = require("./ABIS/NalaTokenABI.json")
const nalaRouterABI = require("./ABIS/NalaRouter.json")

async function main() {
    const signer = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const pancakeRouterAddress: string = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const nalaTokenAdress: string = "0xc351De5746211E2B7688D7650A8bF7D91C809c0D";
    const nalaRouterAddress: string = "0x5895dAbE895b0243B345CF30df9d7070F478C47F";

    const nalaToken = new ethers.Contract(nalaTokenAdress, nalaTokenABI, signer);
    const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);

    await nalaToken.connect(signer).approve(nalaRouterAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    await nalaRouter.connect(signer).addLiquidityETH(nalaToken.address, ethers.utils.parseEther("50000"), 0, 0, {value: ethers.utils.parseEther("500")});

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

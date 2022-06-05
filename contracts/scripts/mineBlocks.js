const { ethers } = require("hardhat");

async function main() {
    for (let index = 0; index < 100; index++) {
        await ethers.provider.send('evm_mine');
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import * as React from 'react';
import stakingContractABI from "../ABIS/StakingABI.json";
import nalaRouterABI from "../ABIS/NalaRouter.json";
import nlaTokenABI from "../ABIS/NalaTokenABI.json";
import { BigNumber, Contract, ethers, utils } from 'ethers';
import { formatUnits, parseEther } from '@ethersproject/units';
import {useEffect, useState, Fragment} from "react";
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import contractAddresses from "../utils/contractsAddresses.json";
import {BigNumber as JsBigNumber} from 'bignumber.js'
import {Widget} from "web3uikit";

export default function StakePage () {

    const [balance, setBalance] = useState(0);
    const [apr, setApr] = useState(0);
    const [TVL, setTVL] = useState(0);
    const [tokenPriceInBUSD, setTokenPriceInBUSD] = useState(0);
    const [activeStakers, setActiveStakers] = useState(0);
    const [balanceWithRewards, setBalanceWithRewards] = useState(0);
    const [amount, setAmount] = useState(0);
    const [rewardsPerDay, setRewardsPerDay] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    const contractAddress = contractAddresses.stakingContract;
    const nlaTokenAddress = contractAddresses.nalaTokenAddress;
    const nalaRouterAddress = contractAddresses.nalaRouterContract;
    const wBNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const BUSDTokenAddress = "0xe9e7cea3dedca5984780bafc599bd69add087d56";

    const TOKENS_PER_BLOCK = 1;

    useEffect(() => {
        getUserStakedAmount();
        getRewardsPerDay();
        getTVL();
        getActiveStakers();
        getTokenPriceInBUSD();
        getUserBalanceWithRewards();
        getAPR(TOKENS_PER_BLOCK); // get staked amout without using async await inside useEffect
    }, [])

    const getAPR = async (
        tokenPerBlock,
      ) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if(signer) {
                try {
                    const pancakeRouterV2 = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", ["function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"], signer);
                    const nalaToken = new ethers.Contract(nlaTokenAddress, nlaTokenABI, signer);
                    const totalStaked = await nalaToken.balanceOf(contractAddress);
                    console.log(`Total staked in staking contract = ${totalStaked / Math.pow(10, 18)}`);
                    if(totalStaked > 0) {
                        // how much NLA tokens we get for 1 BNB 
                        const amountsOut = await pancakeRouterV2
                        .getAmountsOut(
                            ethers.utils.parseEther("1"), 
                            [wBNBTokenAddress, nlaTokenAddress]
                        )

                        const amoutOfNLAFor1BNB = formatUnits(amountsOut[1].toString(), 18);
                        const nlaPriceInBNB = 1 / amoutOfNLAFor1BNB; // NLA Token price in BNB

                        const totalRewardPricePerYear = new JsBigNumber(nlaPriceInBNB).times(tokenPerBlock).times(28640)
                        const totalStakingTokenInPool = new JsBigNumber(nlaPriceInBNB).times(totalStaked / Math.pow(10, 18))
                        const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(10)

                        setApr(apr.toNumber());
                    }
                } catch (error) {
                    setApr(0);
                }
            }
        }
    }

    const stakeTokens = async (amount) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer && parseInt(amount) > 0) {
              const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
              const nlaToken = new ethers.Contract(nlaTokenAddress, ["function approve(address _spender, uint256 _value) public returns (bool success)"], signer);
              const approveTx = await nlaToken.connect(signer).approve(stakingContract.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
              approveTx.wait(3);
              try {
                const tx = await stakingContract.connect(signer).stakeTokens(
                    ethers.utils.parseEther(amount.toString())
                )
                tx.wait();
                console.log(tx);
                } catch (error) {
                    console.log("Transaction error");
                }
            } else {
                setErrorMessage("Cannot stake 0 tokens");
            }
        }
        
    }

    const withdrawTokens = async (amount) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer && parseInt(amount) > 0) {
              const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
              const nlaToken = new ethers.Contract(nlaTokenAddress, ["function approve(address _spender, uint256 _value) public returns (bool success)"], signer);
              nlaToken.connect(signer).approve(stakingContract.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
              try {
                const tx = await stakingContract.connect(signer).withdrawTokens(
                    ethers.utils.parseEther(amount.toString())
                )
                tx.wait();
                } catch (error) {
                    console.log("Transaction error");
                }
            } else {
                setErrorMessage("Cannot stake 0 tokens");
            }
        }
        
    }

    const getUserStakedAmount = async () => {

        let balance;

        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
              const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
              try {
                balance = await stakingContract.stakerBalance(signer.getAddress());
                } catch (error) {
                    console.log("Transaction error");
                }
            }
        }

        // console.log(formatUnits(BigNumber.from(balance.toString(), 18)));
        setBalance(balance / Math.pow(10, 18));
        return formatUnits(balance / Math.pow(10, 18));
    }

    const getUserBalanceWithRewards = async () => {

        let balance;

        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
              const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
              try {
                balance = await stakingContract.getBalanceWithRewards(signer.getAddress());
                } catch (error) {
                    console.log("Transaction error");
                }
            }
        }

        // console.log(formatUnits(BigNumber.from(balance.toString(), 18)));
        setBalanceWithRewards(balance / Math.pow(10, 18));
    }

    const getRewardsPerDay = async () => {
        let rewards = 0;
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
                const userStakedBalance = await getUserStakedAmount();
                if(userStakedBalance > 0) {
                    const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
                    try {
                        rewards = await stakingContract.getRewardsPerDay(signer.getAddress());
                        setRewardsPerDay(rewards / Math.pow(10, 18));
                    } catch (error) {
                        console.log("Transaction error");
                    }
                }
            }
        }
    }

    const getTVL = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
                const nalaToken = new ethers.Contract(nlaTokenAddress, nlaTokenABI, signer);
                const totalStaked = await nalaToken.balanceOf(contractAddress);
                setTVL(totalStaked / Math.pow(10, 18));
            }
        }
    }

    const getTokenPriceInBUSD = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
                const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);
                const amountsOut = await nalaRouter
                .getAmountsOutTokens(
                    ethers.utils.parseEther("1"), 
                    [wBNBTokenAddress, nlaTokenAddress]
                )

                const amoutOfNLAFor1BNB = formatUnits(amountsOut[1].toString(), 18);
                const nlaPriceInBNB = 1 / amoutOfNLAFor1BNB;

                console.log(`NLA price in BNB = ${nlaPriceInBNB}`);

                const bnbPriceInBUSD = await nalaRouter
                .getAmountsOutTokens(
                    ethers.utils.parseEther("1"), 
                    [wBNBTokenAddress, BUSDTokenAddress]
                )

                const nlaPriceInBUSD = formatUnits(bnbPriceInBUSD[1].toString(), 18) * nlaPriceInBNB;

                console.log(`NLA price in BUSD = ${nlaPriceInBUSD}`);

                setTokenPriceInBUSD(nlaPriceInBUSD);
            }
        }
    }

    const getActiveStakers = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
                const stakingContract = new ethers.Contract(contractAddress, stakingContractABI, signer);
                try {
                    const activeStakersLength = await stakingContract.getActiveStakeholders();
                    setActiveStakers(activeStakersLength);
                    console.log(`Active stakeholders = ${activeStakersLength}`);
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }

    return (
        <>
            <div style={{ display: 'grid', gap: '20px', padding: '40px 20px', width: "530px" }}>
                <section style={{ display: 'flex', gap: '20px' }}>
                    <Widget info={`${rewardsPerDay.toFixed(2)} NLA`} title="Rewards per day"/>
                    <Widget info={`${TVL.toFixed(2)} NLA`} title="Total NLA staked" />
                </section>
                <section style={{ display: 'flex', gap: '20px' }}>
                    <Widget info={`${apr.toFixed(2)}%`} title="APR" />
                    <Widget info={parseInt(activeStakers)} title="Active stakers" />
                    <Widget info={`${tokenPriceInBUSD.toFixed(2)}$`} title="NLA Price in BUSD" />
                </section>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
                    <Button style={{marginRight: "25%"}} color="secondary" variant="contained" key="Deposit" onClick={() => stakeTokens(amount)}>Deposit</Button>
                    <Button color="secondary" variant="contained" key="Withdraw" onClick={() => withdrawTokens(amount)}>Withdraw</Button>
                </div>
                <TextField id="outlined-basic" label="Amount..." variant="outlined" size="small" type="number" onChange={(e) => setAmount(e.target.value)}/>
                <small style={{color: "red"}}>{errorMessage}</small>
            </div>
        </>
    )
}
import * as React from 'react';
import {useEffect, useState} from "react";
import NalaRouterABI from "../ABIS/NalaRouter.json";
import contractAddresses from "../utils/contractsAddresses.json";
import {tokens} from "../utils/availableTokens";
import nalaRouterABI from "../ABIS/NalaRouter.json";
import pancakeFactoryABI from "../ABIS/PancakeFactory.json";
import lpTokenABI from "../ABIS/LPTokenABI.json";
import nalaTokenABI from "../ABIS/NalaTokenABI.json";
import { BigNumber, ethers } from 'ethers';
import {Widget} from "web3uikit";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function Pools () {

    const nalaRouterAddress = contractAddresses.nalaRouterContract;
    const nlaTokenAddress = contractAddresses.nalaTokenAddress;
    const wBNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const pancakeFactoryV2Address = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
    const BUSDTokenAddress = "0xe9e7cea3dedca5984780bafc599bd69add087d56";

    const [liquidity, setLiquidity] = useState(0);
    const [amountToAddWBNB, setAmountToAddWBNB] = useState(0);
    const [amountToAddNLA, setAmountToAddNLA] = useState(0);
    const [amountToRemove, setAmountToRemove] = useState(0);
    const [reserveWBNB, setReserveWBNB] = useState(0);
    const [reserveNLA, setReserveNLA] = useState(0);
    const [poolLiquidity, setPoolLiquidity] = useState(0);
    const [tokenImported, setTokenImported] = useState(false);
    const [lpTokenBalance, setLPTokenBalance] = useState(0);

    useEffect(() => {
        // const timer = setInterval(async () => {
        //     getLPTokenBalance();
        //     getReserves();
        //   }, 1000);
        // return () => clearInterval(timer);
        getLPTokenBalance();
        getReserves();
    },[])
   
    const addLiquidityETH = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const nalaToken = new ethers.Contract(nlaTokenAddress, nalaTokenABI, signer);
                const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);
            
                await nalaToken.connect(signer).approve(nalaRouterAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
                // const factory = await nalaRouter.factory();
                // console.log(factory);
                await nalaRouter.connect(signer).addLiquidityETH(
                    nlaTokenAddress, 
                    ethers.utils.parseEther(amountToAddNLA.toString()),
                    0, 
                    0, // amountETHMin
                    {value: ethers.utils.parseEther(amountToAddWBNB.toString())}
                );

            }
        }
    }

    const removeLiquidityETH = async (amountOfBNB) => {
       
    }

    const setAmountsWBNB = async (amountOfBNB) => {
        if(amountOfBNB === "") {
            setAmountToAddNLA("");
            setAmountToAddWBNB("");
        }
        if(parseInt(amountOfBNB) === 0) {
            setAmountToAddNLA(0);
            setAmountToAddWBNB(0);
        }
        else if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const nalaToken = new ethers.Contract(nlaTokenAddress, nalaTokenABI, signer);
                const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);

                const amountsOut = await nalaRouter
                .getAmountsOutTokens(
                    ethers.utils.parseEther(amountOfBNB.toString()), 
                    [wBNBTokenAddress, nlaTokenAddress]
                )
                console.log(`Amounts out = ${amountsOut[1] / Math.pow(10, 18)}`);
                
                setAmountToAddWBNB(amountOfBNB);
                setAmountToAddNLA(amountsOut[1] / Math.pow(10, 18));
            }
        }
    }

    const setAmountsNLA = async (amountOfNLA) => {
        console.log(amountOfNLA);
        if(amountOfNLA === "") {
            setAmountToAddNLA("");
            setAmountToAddWBNB("");
        }
        if(parseInt(amountOfNLA) === 0) {
            setAmountToAddNLA(0);
            setAmountToAddWBNB(0);
        }
        else if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const nalaToken = new ethers.Contract(nlaTokenAddress, nalaTokenABI, signer);
                const nalaRouter = new ethers.Contract(nalaRouterAddress, nalaRouterABI, signer);

                const amountsOut = await nalaRouter
                .getAmountsOutTokens(
                    ethers.utils.parseEther(amountOfNLA.toString()), 
                    [nlaTokenAddress, wBNBTokenAddress]
                )
                console.log(`Amounts out = ${amountsOut[1] / Math.pow(10, 18)}`);
                
                setAmountToAddWBNB(amountsOut[1] / Math.pow(10, 18));
                setAmountToAddNLA(amountOfNLA);
            }
        }
    }

    const findLPTokenAddress = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const pancakeFactory = new ethers.Contract(pancakeFactoryV2Address, pancakeFactoryABI, signer);
                const lpTokenAddress = await pancakeFactory.getPair(wBNBTokenAddress, nlaTokenAddress);
                console.log("LP Token address => ", lpTokenAddress);
                return lpTokenAddress;
            }
        }
    }

    const importTokenToMetamask = async () => {
        findLPTokenAddress();
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20', 
              options: {
                address: await findLPTokenAddress(), 
                symbol: "WBNB-NLA LP", 
                decimals: 18, 
                image: "https://png.pngitem.com/pimgs/s/121-1211195_head-small-to-medium-sized-cats-whiskers-cat.png", 
              },
            },
          });
          if (wasAdded) {
            setTokenImported(true);
            console.log('Thanks for your interest!');
          } else {
            setTokenImported(false);
            console.log('NLA LP Token has not been added');
          }
        } catch (error) {
          console.log(error);
        }
    }

    const getLPTokenBalance = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const pancakeFactory = new ethers.Contract(pancakeFactoryV2Address, pancakeFactoryABI, signer);
                const lpTokenAddress = await pancakeFactory.getPair(wBNBTokenAddress, nlaTokenAddress);
                const lpTokenContract = new ethers.Contract(lpTokenAddress, lpTokenABI, signer);
                const balance = await lpTokenContract.balanceOf(signer.getAddress());
                console.log("LP BALANCE", balance / Math.pow(10, 18));
                setLPTokenBalance(balance)
            }
        }
    }

    const getReserves = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const pancakeFactory = new ethers.Contract(pancakeFactoryV2Address, pancakeFactoryABI, signer);
                const lpTokenAddress = await pancakeFactory.getPair(wBNBTokenAddress, nlaTokenAddress);
                const lpTokenContract = new ethers.Contract(lpTokenAddress, lpTokenABI, signer);
                const reserves = await lpTokenContract.getReserves();
                setReserveWBNB(reserves[0]);
                setReserveNLA(reserves[1])
                getTokenPriceInBUSD(reserves[0], reserves[1])
            }
        }
    }

    const getTokenPriceInBUSD = async (wbnbReserve, nlaReserve) => {
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

                const amoutOfNLAFor1BNB = amountsOut[1] / Math.pow(10, 18);
                const nlaPriceInBNB = 1 / amoutOfNLAFor1BNB;

                // console.log(`NLA price in BNB = ${nlaPriceInBNB}`);

                const bnbPriceInBUSD = await nalaRouter
                .getAmountsOutTokens(
                    ethers.utils.parseEther("1"), 
                    [wBNBTokenAddress, BUSDTokenAddress]
                )

                // console.log("bnbPriceInBUSD", bnbPriceInBUSD[1] / Math.pow(10, 18));

                const nlaPriceInBUSD = (bnbPriceInBUSD[1] / Math.pow(10, 18)) * nlaPriceInBNB;
                // console.log("nlaPriceInBUSD", nlaPriceInBUSD);

                const wbnbValueInBUSD = (bnbPriceInBUSD[1] / Math.pow(10, 18)) * (wbnbReserve / Math.pow(10, 18));
                const nlaValueInBUSD = (nlaPriceInBUSD) * (nlaReserve / Math.pow(10, 18));

                // console.log("wbnbValueInBUSD", wbnbValueInBUSD);
                // console.log("nlaValueInBUSD", nlaValueInBUSD);

                setPoolLiquidity(wbnbValueInBUSD + nlaValueInBUSD);

            }
        }
    }

    return (
        <>
            <div style={{ display: 'grid', gap: '20px', padding: '40px 20px', width:"500px" }}>
                <section style={{ display: 'flex', gap: '20px' }}>
                    <Widget info="WBNB - NLA" title="Pool tokens" />
                    <Widget info={(lpTokenBalance / Math.pow(10, 18)).toFixed(6)} title="Your LP Balance" />
                </section>
                <section style={{ display: 'flex', gap: '20px' }}>
                    {/* <Widget info={(reserveWBNB / Math.pow(10, 18)).toFixed(2)} title="WBNB Reserve" />
                    <Widget info={(reserveNLA / Math.pow(10, 18)).toFixed(2)} title="NLA Reserve" /> */
                    <Widget info={`${poolLiquidity.toFixed(3)} $`} title="Total liquidity value in $" />
                    }
                </section>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
                    <Button style={{marginRight: "25%"}} color="secondary" variant="contained" key="Deposit" onClick={() => addLiquidityETH()}>Add liquidity</Button>
                    <Button color="secondary" variant="contained" key="Withdraw" onClick={() => removeLiquidityETH()}>Remove liquidity</Button>
                </div>
                <TextField value={amountToAddWBNB} id="outlined-basic" label="Amount of WBNB..." variant="outlined" size="small" type="number" onChange={(e) => setAmountsWBNB(e.target.value)}/>
                <TextField value={amountToAddNLA} id="outlined-basic" label="Amount of NLA..." variant="outlined" size="small" type="number" onChange={(e) => setAmountsNLA(e.target.value)}/>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
                    {tokenImported ?
                    <Button disabled={true} color="info" variant="contained" key="Deposit">Token imported</Button> 
                    : <Button color="info" variant="contained" key="Deposit" onClick={() => importTokenToMetamask()}>Import LP Token to metamask</Button>}
                </div>
            </div>
        </>
    )
}
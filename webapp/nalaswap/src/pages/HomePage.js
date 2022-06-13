import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import {useEffect, useState, Fragment} from "react";
import { BigNumber, Contract, ethers, utils } from 'ethers';
import NalaRouterAbi from "../ABIS/NalaRouter.json"
import {tokens} from "../utils/availableTokens";
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import { formatUnits } from '@ethersproject/units';
import CircularProgress from '@mui/material/CircularProgress';
import contractAddresses from "../utils/contractsAddresses.json";
import {Dropdown} from "web3uikit";

export default function HomePage () {

    const [tokenIn, setTokenIn] = useState(tokens[0]);
    const [tokenOut, setTokenOut] = useState(tokens[1]);

    const [amountIn, setAmountIn] = useState(0);
    const [amountOut, setAmountOut] = useState(0);

    const [tokenInBalance, setTokenInBalance] = useState(0);
    const [tokenOutBalance, setTokenOutBalance] = useState(0);

    const [loadingTransaction, setLoadingTransaction] = useState(false);

    const contractAddress = contractAddresses.nalaRouterContract;

    useEffect(() => {
        const getBalances = async () => {
            setTokenInBalance(await getTokenBalance(tokenIn.address));
            setTokenOutBalance(await getTokenBalance(tokenOut.address));
        }
       getBalances();
    },[]);

    const swapExactTokensForBNB = async (tokenIn, amountIn, signer, nalaRouter) => {
        setLoadingTransaction(true);
        try {
            const tokenInContract = new ethers.Contract(tokenIn.address, ["function approve(address _spender, uint256 _value) public returns (bool success)"], signer)
            await tokenInContract.connect(signer).approve(contractAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
            const tx = await nalaRouter.connect(signer).swapExactTokensForBNB(
                tokenIn.address, 
                ethers.utils.parseEther(amountIn.toString()),
                0,
            )
            tx.wait();
            setLoadingTransaction(false);
        } catch (error) {
            console.log("Transaction error");
            setLoadingTransaction(false);
        }
    }

    const swapExactBNBForTokens = async (tokenOut, amountIn, signer, nalaRouter) => {
        console.log("swapExactBNBForTokens");
        setLoadingTransaction(true);
        try {
            const tx = await nalaRouter
                .connect(signer)
                .swapExactBNBForTokens(
                    0, 
                    tokenOut.address, 
                    { value: ethers.utils.parseEther(amountIn)}
                );
            tx.wait();
            setLoadingTransaction(false);
        } catch (error) {
            console.log("Transaction error");
            setLoadingTransaction(false);
        }
        
    }

    const swapExactTokensForTokens = async (tokenIn, tokenOut, amountIn, signer, nalaRouter) => {
        setLoadingTransaction(true);
        try {
            const tokenInContract = new ethers.Contract(tokenIn.address, ["function approve(address _spender, uint256 _value) public returns (bool success)"], signer)
            await tokenInContract.connect(signer).approve(contractAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
            const tx = await nalaRouter.connect(signer).swapExactTokensForTokens(
                ethers.utils.parseEther(amountIn.toString()),
                0,
                [tokenIn.address, tokenOut.address]
            )
            tx.wait();
            setLoadingTransaction(false);
        } catch (error) {
            console.log("Transaction error");
            setLoadingTransaction(false);
        }
    }

    const swapTokens = async (tokenIn, tokenOut, amountIn, amountOut) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            console.log(signer);
            if (signer) {
              const contract = new ethers.Contract(contractAddress, NalaRouterAbi, signer)
              if(tokenIn.label === "BNB") {
                swapExactBNBForTokens(tokenOut, amountIn, signer, contract);
              } else if (tokenOut.label === "BNB") {
                swapExactTokensForBNB(tokenIn, amountIn, signer, contract);
              } else {
                swapExactTokensForTokens(tokenIn, tokenOut, amountIn, signer, contract);
              }
            }
        }
    }

    const switchTokenOrder = async () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);
        setTokenInBalance(await getTokenBalance(tokenOut.address));
        setTokenOutBalance(await getTokenBalance(tokenIn.address));
        const amountInCopy = amountIn;
        const amountOutCopy = amountOut;
        setAmountIn(amountOutCopy);
        setAmountOut(amountInCopy);
    }

    const getTokenBalance = async (tokenAddress) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const tokenInContract = new ethers.Contract(tokenAddress, ["function balanceOf(address tokenOwner) public view returns (uint balance)"], signer);
                const balance = await tokenInContract.balanceOf(signer.getAddress());
                return balance;
            }
        }
    }

    const setAmountsToken1 = async (amount) => {
        if(amount === "") {
            setAmountIn("");
            setAmountOut("");
        }
        if(parseInt(amount) === 0) {
            setAmountIn(0);
            setAmountOut(0);
        } else if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const pancakeRouterV2 = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", ["function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"], signer);
                setAmountIn(amount);
                const tokenOutAmount = await pancakeRouterV2
                    .getAmountsOut(
                        ethers.utils.parseEther(amount.toString()), 
                        [tokenIn.address, tokenOut.address]
                    )
                setAmountOut(tokenOutAmount[1] / Math.pow(10, 18));
            }
        }
    }

    const setAmountsToken2 = async (amount) => {
        if(amount === "") {
            setAmountIn("");
            setAmountOut("");
        }
        if(parseInt(amount) === 0) {
            setAmountIn(0);
            setAmountOut(0);
        } else if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner();
            if (signer) {
                const pancakeRouterV2 = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", ["function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"], signer);
                setAmountOut(amount);
                const tokenOutAmount = await pancakeRouterV2
                    .getAmountsOut(
                        ethers.utils.parseEther(amount.toString()), 
                        [tokenOut.address, tokenIn.address]
                    )
                setAmountIn(tokenOutAmount[1] / Math.pow(10, 18));
            }
        }
    }

    return (
        <>
            <Box
                component="form"
                sx={{
                    '& > :not(style)': { m: 1, width: '25ch'},
                }}
                noValidate
                autoComplete="off"
                style={{borderRadius:"15px", border:"4px solid #502199", marginBottom:"5%", padding: "15px"}}
                >
                <Autocomplete
                    disablePortal
                    id="selectBox1"
                    options={tokens.filter(token => token.address !== tokenOut.address)}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label={`Balance: ${tokenInBalance / Math.pow(10, 18)}`} /> }
                    style={{border:"1px solid #502199", borderRadius: "10px"}}
                    value={tokenIn.label ? tokenIn.label : "BNB"}
                    onChange={async (event, newValue) => {
                        if(newValue.address !== tokenOut.address) {
                            setTokenIn(newValue);
                            setTokenInBalance(await getTokenBalance(newValue.address));
                            // console.log(tokenInBalance);
                        } 
                    }}
                />
                <TextField 
                    id="amountIn" 
                    type="number" 
                    placeholder="0.0" 
                    variant="outlined" 
                    value={amountIn}
                    InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <img src={tokenIn.image ? tokenIn.image : "https://seeklogo.com/images/B/binance-coin-bnb-logo-97F9D55608-seeklogo.com.png"} style={{width:"25px"}}/>
                          </InputAdornment>
                        ),
                      }}
                    onChange={async (e) => {
                        setAmountsToken1(e.target.value)
                    }}
                />
                <div>
                <Tooltip title="Switch token order"> 
                    <Button onClick={() => switchTokenOrder()} variant="text"><RefreshIcon sx={{ color:"#FFEF00"}}/></Button>
                </Tooltip>
                </div>
                <Autocomplete
                    disablePortal
                    id="selectBox2"
                    options={tokens.filter(token => token.address !== tokenIn.address)}
                    sx={{ width: "80%" }}
                    renderInput={(params) => <TextField {...params} label={`Balance: ${tokenOutBalance / Math.pow(10, 18)}`} />}
                    style={{border:"1px solid #502199", borderRadius: "10px"}}
                    value={tokenOut.label ? tokenOut.label : "BANANA"}
                    onChange={async (event, newValue) => {
                        if(newValue.address !== tokenIn.address) {
                            setTokenOut(newValue);
                            setTokenOutBalance(await getTokenBalance(newValue.address));
                        } 
                    }}
                />
                <TextField 
                    id="amountOut" 
                    type="number" 
                    placeholder="0.0" 
                    variant="outlined" 
                    value={amountOut}
                    InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <img src={tokenOut.image ? tokenOut.image : "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95/logo.png"} style={{width:"25px"}}/>
                          </InputAdornment>
                        ),
                      }}
                    onChange={(e) => {
                        setAmountsToken2(e.target.value)
                    }}
                />
            </Box>
            <Button 
                onClick={() => swapTokens(tokenIn, tokenOut, amountIn, amountOut)} 
                variant="contained" 
                style={{background: "black", width: "100%", color: "#e3d476"}}
            >
                {loadingTransaction ? <CircularProgress sx={{color:"yellow"}}/> : "Swap tokens"}
            </Button>
        </>
        
    )

}
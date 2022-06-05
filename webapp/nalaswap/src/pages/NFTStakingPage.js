import * as React from 'react';
import {useEffect, useState} from "react";
import nftStakingABI from "../ABIS/NFTStaking.json";
import nalaTokenABI from "../ABIS/NalaTokenABI.json";
import EyesNftABI from "../ABIS/NFTCollection.json";
import { BigNumber, Contract, ethers, utils } from 'ethers';
import { formatUnits, parseEther } from '@ethersproject/units';
import contractAddresses from "../utils/contractsAddresses.json";

export default function StakePage () {

    const [errorMessage, setErrorMessage] = useState("");
    const [myStakedNfts, setMyStakedNfts] = useState([]);
    const [rewardsBalance, setRewardsBalance] = useState(0);
    const [unstakedNFTS, setUnstakedNFTS] = useState([]);

    const nftAddress = contractAddresses.nftCollectionAddress;
    const nftStakingAddress = contractAddresses.nftStakingContract;
    const nalaTokenAddress = contractAddresses.nalaTokenAddress;

    useEffect(() => {
        getRewardsBalance();
        const setAndDisplay = async () => {setMyStakedNfts(await getNFTSStaked())};
        const setAndDisplayUnstakedNFTS = async () => {setUnstakedNFTS(await getNFTBalance())};
        setAndDisplay();
        setAndDisplayUnstakedNFTS();
    }, []);

    const stake = async (nftId) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const nftStakingContract = new ethers.Contract(nftStakingAddress, nftStakingABI, signer);
                const eyesNft = new ethers.Contract(nftAddress, EyesNftABI, signer);
                await eyesNft.setApprovalForAll(nftStakingAddress, true)
                await nftStakingContract.stake(0, [nftId]);
            }
        }
    }

    const unStake = async (nftId) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const nftStakingContract = new ethers.Contract(nftStakingAddress, nftStakingABI, signer);
                await nftStakingContract.unstake(0, [nftId]);
            }
        }
    }

    const claimRewards = async (nftId) => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const nftStakingContract = new ethers.Contract(nftStakingAddress, nftStakingABI, signer);
                await nftStakingContract.claim(0, [nftId]);
            }
        }
    }

    const getRewardsBalance = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const nftStakingContract = new ethers.Contract(nftStakingAddress, nftStakingABI, signer);
                const balance = await nftStakingContract.earningInfo(signer.getAddress(), [1, 2]); // FIX
                const tokensOfOwner = await nftStakingContract.tokensOfOwner(0, signer.getAddress());
                setRewardsBalance(formatUnits(BigNumber.from(balance.toString(), 18)));
            }
        }
    }

    const getNFTSStaked = async () => {
        let nftsIdsArr = [];
        let nftMetadataArr = [];
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const nftStakingContract = new ethers.Contract(nftStakingAddress, nftStakingABI, signer);
                const eyesNft = new ethers.Contract(nftAddress, EyesNftABI, signer);
                nftsIdsArr = await nftStakingContract.tokensOfOwner(0, signer.getAddress());
                for (let index = 0; index < nftsIdsArr.length; index++) {
                    const response = await fetch(`https://gateway.pinata.cloud/ipfs/QmSxkTx7LDNvYYJFFtSVDafd4DD4sAUYD34YydcTML6N7X/${nftsIdsArr[index]}.json`)
                    const responseJson = await response.json();
                    nftMetadataArr.push(responseJson);
                }

            }
        }
        return nftMetadataArr;
    }

    const getNFTBalance = async () => {
        let nftMetadataArr = [];
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            if (signer) {
                const eyesNft = new ethers.Contract(nftAddress, EyesNftABI, signer);
                const amountOfNfts = await eyesNft.balanceOf(signer.getAddress());
                for (let index = 0; index < amountOfNfts; index++) {
                    const nftID = await eyesNft.tokenOfOwnerByIndex(signer.getAddress(), index);
                    const response = await fetch(`https://gateway.pinata.cloud/ipfs/QmSxkTx7LDNvYYJFFtSVDafd4DD4sAUYD34YydcTML6N7X/${nftID}.json`)
                    const responseJson = await response.json();
                    nftMetadataArr.push(responseJson);
                }

            }
        }
        return nftMetadataArr;
    }

    return (
        <>
            <div style={{display: "flex", flexDirection:"row", justifyContent: "space-around"}}>
                <button onClick={() => claimRewards(1)}>Claim rewards</button>
            </div>
           <p>Rewards balance: {rewardsBalance}</p>
           NFT'S Staked currently:
           <div style={{display: "flex", flexDirection:"row", justifyContent: "space-around"}}>
                {myStakedNfts.map(nft => 
                    <div style={{display: "flex", flexDirection:"column", justifyContent: "space-around"}}>
                        <p>{nft.name}</p>
                        <img style={{width: "100px", borderRadius: "10px"}} src={`https://gateway.pinata.cloud/ipfs/QmcEfnhCfPn5SFA9PQ6YRELsTrDRSkapYiHwEAifuWtNQp/${nft.edition}.png`}/>
                        <button onClick={() => unStake(nft.edition)}>Unstake</button>
                    </div>
                )}
                {unstakedNFTS.map(nft => 
                    <div style={{display: "flex", flexDirection:"column", justifyContent: "space-around"}}>
                        <p>{nft.name}</p>
                        <img style={{width: "100px", borderRadius: "10px"}} src={`https://gateway.pinata.cloud/ipfs/QmcEfnhCfPn5SFA9PQ6YRELsTrDRSkapYiHwEAifuWtNQp/${nft.edition}.png`}/>
                        <button onClick={() => stake(nft.edition)}>Stake</button>
                    </div>
                )}
            </div>
        </>
    )
}
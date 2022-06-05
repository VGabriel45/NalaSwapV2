import * as React from 'react';
import nftAbi from "../ABIS/NFTCollection.json";
import { BigNumber, Contract, ethers, utils } from 'ethers';
import {useEffect, useState, Fragment} from "react";
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import contractAddresses from "../utils/contractsAddresses.json";
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

export default function StakePage () {

    const [errorMessage, setErrorMessage] = useState("");
    const [ownedNfts, setOwnedNfts] = useState([]);

    const nftAddress = contractAddresses.nftCollectionAddress;

    useEffect(() => {
        const displayAndSet = async () => {setOwnedNfts(await displayOwnedNfts())};
        displayAndSet();
    }, [])

    const getOwnedNFTS = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            let nftArr = [];
            if (signer) {
              const nftContract = new ethers.Contract(nftAddress, nftAbi, signer);
              const ownedNftsCount = parseInt(await nftContract.balanceOf(signer.getAddress()));
              for (let index = 0; index < ownedNftsCount; index++) {
                    let nftId = await nftContract.tokenOfOwnerByIndex(signer.getAddress(), index);
                    nftArr.push(nftId);                  
              }
              return nftArr;
            }
        }
    }

     const displayOwnedNfts = async () => {
        let ids = await getOwnedNFTS();
        let nftMetadataArr = [];
        for (let index = 0; index < ids.length; index++) {
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/QmSxkTx7LDNvYYJFFtSVDafd4DD4sAUYD34YydcTML6N7X/${ids[index]}.json`)
            const responseJson = await response.json();
            nftMetadataArr.push(responseJson);
        }
        return nftMetadataArr;
    }

    const mintNft = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            if (signer) {
              const nftContract = new ethers.Contract(nftAddress, nftAbi, signer);
              try {
                const tx = await nftContract.connect(signer).mint(
                    signer.getAddress(),
                    1,
                    {value: ethers.utils.parseEther("1"), from: signer.getAddress()}
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

    const buttons = [
        <Button key="Mint" onClick={() => mintNft()}>Mint</Button>,
    ];

    return (
        <Grid sx={{ flexGrow: 1 }} container spacing={2}>
            <Button color="secondary" variant="contained" key="Mint" onClick={() => mintNft()} style={{marginLeft: 180}}>Mint</Button>
            <Grid item xs={12}>
                <Grid container justifyContent="center" spacing={3}>
                    {ownedNfts.map(nft => 
                        <Grid key={nft.name} item>
                            <Card sx={{ maxWidth: 345 }}>
                            <CardMedia
                                component="img"
                                height="140"
                                src={`https://gateway.pinata.cloud/ipfs/QmcEfnhCfPn5SFA9PQ6YRELsTrDRSkapYiHwEAifuWtNQp/${nft.edition}.png`}
                                alt="green iguana"
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                {nft.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                An eye.
                                </Typography>
                            </CardContent>
                        </Card>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Grid>
    )
}
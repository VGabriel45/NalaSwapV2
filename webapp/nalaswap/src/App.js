import logo from "./logo.svg";
import "./App.css";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar"
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import StakePage from "./pages/StakePage";
import NftsPage from "./pages/NftsPage";
import NFTStakingPage from "./pages/NFTStakingPage";
import Pools from './pages/Pools';

function App() {

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
      isMetamaskConnected()
    },[isConnected]);

    const isMetamaskConnected = async () => {
      if (typeof window !== "undefined") {
        const { ethereum } = window;
        if (ethereum) {
            var provider = new ethers.providers.Web3Provider(ethereum);
        }
      }
      const accounts = await provider.listAccounts();
      setIsConnected(accounts.length > 0);
    }

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <header className="App-header">
            {isConnected ? 
              <div style={{marginTop: "-150px"}}>
                <img src={logo} style={{width:"90%", height:"30vh"}} className="App-logo" alt="logo" />
                  <Routes >
                    <Route path="/swap" element={<HomePage/>} exact/>
                    <Route path="/pools" element={<Pools/>} />
                    <Route path="/stake%20nla" element={<StakePage/>} exact/>
                    <Route path="/mint%20nft" element={<NftsPage/>} />
                    <Route path="/stake%20nft" element={<NFTStakingPage/>} />
                  </Routes>
              </div>
              : ""
            }
    </header>
      </BrowserRouter>
    </div>
  );
}

export default App;

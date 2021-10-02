import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react"
import { ethers } from "ethers";
import myEpicNft from './utils/myEpicNFT.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const MY_TWITTER_HANDLE = 'thenkkurt';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const MY_TWITTER_LINK = `https://twitter.com/${MY_TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-zzsucrdtnz';
const TOTAL_MINT_COUNT = 50;

const CONTRACT_ADDRESS = "0x6570bb9345edF9CE8930fEE6B854ef3c26a1C0ad";

const ETHEREUM_NETWORKS = {1: "Mainnet", 2: "Kovan",
3: "Ropsten", 
4: "Rinkeby",
5: "Goerli"};

const App = () => {
  /*
    * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
    */
    const [currentAccount, setCurrentAccount] = useState("");
    const [numberOfMinted, setNumberOfMinted] = useState(0);
    const [loading, setLoading] = useState(false);
    
    /*
    * Gotta make sure this is async.
    */
    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
      } else {
          console.log("We have the ethereum object", ethereum);
          if (window.ethereum.networkVersion != 4) {
            alert(`Currently the only Ethereum Network supported is Rinkeby. Please connect to Rinkeby and retry. You're currently connected to: ${ETHEREUM_NETWORKS[window.ethereum.networkVersion]}`)
          }
          console.log(window.ethereum.networkVersion,ETHEREUM_NETWORKS[window.ethereum.networkVersion], 'window.ethereum.networkVersion');
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      /*
      * User can have multiple authorized accounts, we grab the first one if its there!
      */
      if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
          // Setup listener! This is for the case where a user comes to our site
          // and ALREADY had their wallet connected + authorized.
          setupEventListener()
      } else {
          console.log("No authorized account found")
      }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener() 
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // First initialize the current minted NFT count
        let currentCount = await connectedContract.getCurrentNFTCount();
        setNumberOfMinted(currentCount.toNumber());

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          setNumberOfMinted(tokenId.toNumber());
          setLoading(false);
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
  
    try {
      const { ethereum } = window;

      if (ethereum) {

        if (numberOfMinted < 50) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

          console.log("Going to pop wallet now to pay gas...")
          let nftTxn = await connectedContract.makeAnEpicNFT();
          setLoading(true);
          console.log("Mining...please wait.")
          await nftTxn.wait();
        
          console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        } else {
          alert(`Max number of NFTs are minted!${numberOfMinted}/${TOTAL_MINT_COUNT}`)
          console.log("Max number of NFTs are minted.");
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const getTotalNFTsMintedSoFar = () => (
      <button className = "cta-button total-mint-count-button" > {numberOfMinted}/{TOTAL_MINT_COUNT} minted so far
    </button>
  );
/*
  * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
  */
  const renderMintUI = () => (
    <button onClick={askContractToMintNft} className="cta-button mint-button">
    {numberOfMinted >= 50 ? "Max minted" : "Mint NFT"}
    </button>
  )
  const loadingAnimation = () => (
    // <button onClick={null} className="cta-button connect-wallet-button">
    // Loading ...
    // </button>
    <div class = "loader"> </div>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
          <br></br>
          <br></br>
          {getTotalNFTsMintedSoFar()}
          <br></br><br></br><br></br>
          {loading && loadingAnimation()}
          <br></br><br></br><br></br>
          <a href={OPENSEA_LINK} class="cta-button opensea-button" > 🌊 View Collection on OpenSea</a>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          built on &nbsp;
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`@${TWITTER_HANDLE}`} </a>
             &nbsp;&nbsp;by&nbsp;&nbsp; 
          <a
            className="footer-text"
            href={MY_TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{` @${MY_TWITTER_HANDLE}`} </a>
        </div>
      </div>
    </div>
  );
};

export default App;

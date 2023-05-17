import * as zksync from "zksync-web3";
import { BigNumber, ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from 'fs';

const PRIVATE_KEY = "YOURPRIVATEKEYHERE";

const zkSyncProvider = new zksync.Provider("https://testnet.era.zksync.dev/");
const ethereumProvider = ethers.getDefaultProvider("goerli");

const wallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider, ethereumProvider);

const syncSwapRouterAddress = "0xB3b7fCbb8Db37bC6f572634299A58f51622A847e"

const filePath = './abi/syncswap.json';
const filePath2 = './abi/syncswapclassicfactoryabi.json'

const readJSONFile = (): any => {
  const rawData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(rawData.toString());
  return jsonData;
};

const syncSwapABI = readJSONFile();

const readJSONFile2 = (): any => {
  const rawData = fs.readFileSync(filePath2);
  const jsonData = JSON.parse(rawData.toString());
  return jsonData;
};

const classicFactoryABI = readJSONFile2();

const contract = new ethers.Contract(
  syncSwapRouterAddress,
  syncSwapABI,
  wallet,
)

const syncSwapRouterContract = new zksync.Contract(syncSwapRouterAddress, syncSwapABI, wallet)
const classicPoolFactoryAddress = "0xf2FD2bc2fBC12842aAb6FbB8b1159a6a83E72006"
const classicPoolFactory = new zksync.Contract(classicPoolFactoryAddress, classicFactoryABI, wallet)

const signer = wallet.connect(zkSyncProvider)

// my address
const signerAddress = "YOURWALLETHERE"

// USDT token
const usdtTestAddress = "0xfcEd12dEbc831D3a84931c63687C395837D42c2B"
const wethTestAddress = "0x20b28b1e4665fff290650586ad76e977eab90c5d"



// bytecode
const dataField = ethers.utils.defaultAbiCoder.encode(['address'], [signerAddress])

// const inputs = [
//   {
//     token: tokenAddress,
//     amount: tokenValue
//   },
//   {
//     token: ethers.constants.AddressZero,
//     amount: ethValue
//   }
// ]

export default async function (hre: HardhatRuntimeEnvironment) {

  const gasPrice = await zkSyncProvider.getGasPrice()

  const poolAddress = await classicPoolFactory.getPool(wethTestAddress, usdtTestAddress)
  console.log(poolAddress)

  // Eth value
  const ethValue = ethers.utils.parseEther("0.0005")
  const withdrawMode = 1
  
  const swapData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint8"],
    [wethTestAddress, wallet.address, withdrawMode]
  )

  const steps = [{
    pool: poolAddress,
    data: swapData,
    callback: ethers.constants.AddressZero,
    callbackData: '0x'
  }]

  const paths = [{
    steps: steps,
    tokenIn: ethers.constants.AddressZero,
    amountIn: ethValue
  }]

  const response = await syncSwapRouterContract.swap(
    paths,
    withdrawMode,
    BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
    {
        value: ethValue,
    }
  )

  const result = await response.wait(1)

  console.log(`Transaction to deposit syncswap is ${response.hash}`);
}


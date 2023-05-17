async function swapETHToUSDC(privateKey, i) {
  const wallet = new zksync.Wallet(privateKey, zkSyncProvider, ethereumProvider);

  const classicFactoryABI = readJSONFile("./abi/syncswapclassicfactoryabi.json");
  const syncSwapABI = readJSONFile("./abi/syncswap.json");

  const syncSwapRouterContract = new zksync.Contract(syncSwapRouterAddress, syncSwapABI, wallet)
  const classicPoolFactory = new zksync.Contract(classicPoolFactoryAddress, classicFactoryABI, wallet)

  const gasPrice = await zkSyncProvider.getGasPrice()
  const poolAddress = await classicPoolFactory.getPool(wethAddress, usdcAddress)

  // Eth value
  const ethValue = ethers.utils.parseEther(swapETHToUSDCAmount)
  const withdrawMode = 1
  
  const swapData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint8"],
    [wethAddress, wallet.address, withdrawMode]
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

  const randomTime = Math.floor(Math.random() * 10000) + 3000
  console.log(`[${i}] Sleeping ${randomTime} ms`)
  await sleep(randomTime)

  const response = await syncSwapRouterContract.swap(
    paths,
    withdrawMode,
    BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
    {
        value: ethValue,
    }
  )

  const result = await response.wait(1)

  console.log(`[${i}] Transaction to swap ETH->USDC from SyncSwap is ${response.hash}`);
}

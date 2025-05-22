import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from "@solana/spl-token";
import { SolanaOptionsDex } from "../target/types/solana_options_dex";
import { createOptionsClient, OptionType } from "../client/index";
import fs from "fs";

// Configuration
const NETWORK = process.env.NETWORK || "devnet"; // devnet, testnet, or mainnet-beta
const PROGRAM_ID = process.env.PROGRAM_ID || "E1TXVekuewkrgWspyhUToYeZzucutnEqyVG9eFf8WTKq";

async function main() {
  console.log("🚀 Starting Solana Options DEX Deployment");
  console.log(`Network: ${NETWORK}`);
  console.log(`Program ID: ${PROGRAM_ID}`);
  
  // Setup connection and provider
  const connection = new Connection(
    NETWORK === "mainnet-beta" 
      ? clusterApiUrl("mainnet-beta")
      : clusterApiUrl(NETWORK as any),
    "confirmed"
  );
  
  // Load authority keypair (should be your wallet)
  let authority: Keypair;
  try {
    const secretKey = JSON.parse(fs.readFileSync("./authority-keypair.json", "utf8"));
    authority = Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    console.log("📝 Generating new authority keypair...");
    authority = Keypair.generate();
    fs.writeFileSync(
      "./authority-keypair.json",
      JSON.stringify(Array.from(authority.secretKey))
    );
    console.log(`Authority Public Key: ${authority.publicKey.toString()}`);
    
    if (NETWORK !== "mainnet-beta") {
      console.log("💰 Airdropping SOL to authority...");
      await connection.confirmTransaction(
        await connection.requestAirdrop(authority.publicKey, 5 * LAMPORTS_PER_SOL)
      );
    }
  }
  
  console.log(`Authority: ${authority.publicKey.toString()}`);
  
  // Create wallet and provider
  const wallet = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  
  // Load program
  const programId = new PublicKey(PROGRAM_ID);
  const program = anchor.workspace.SolanaOptionsDex as Program<SolanaOptionsDex>;
  
  // Create options client
  const client = createOptionsClient(connection, wallet, programId);
  
  try {
    // Step 1: Initialize Protocol
    console.log("\n📋 Step 1: Initializing Protocol...");
    const initTx = await client.initializeProtocol(
      authority,
      50,  // 0.5% protocol fee
      10,  // 0.1% settlement fee
      20   // 0.2% liquidation fee
    );
    console.log(`✅ Protocol initialized: ${initTx}`);
    
    // Step 2: Create Test Tokens (only for devnet/testnet)
    let solMint: PublicKey;
    let usdcMint: PublicKey;
    
    if (NETWORK !== "mainnet-beta") {
      console.log("\n🪙 Step 2: Creating Test Tokens...");
      
      // Create SOL-like token (6 decimals)
      solMint = await createMint(
        connection,
        authority,
        authority.publicKey,
        authority.publicKey,
        6 // 6 decimals
      );
      console.log(`SOL Token Mint: ${solMint.toString()}`);
      
      // Create USDC-like token (6 decimals)
      usdcMint = await createMint(
        connection,
        authority,
        authority.publicKey,
        authority.publicKey,
        6 // 6 decimals
      );
      console.log(`USDC Token Mint: ${usdcMint.toString()}`);
      
      // Create authority token accounts and mint initial supply
      const authoritySOLAccount = await createAccount(
        connection,
        authority,
        solMint,
        authority.publicKey
      );
      
      const authorityUSDCAccount = await createAccount(
        connection,
        authority,
        usdcMint,
        authority.publicKey
      );
      
      // Mint initial supply
      await mintTo(
        connection,
        authority,
        solMint,
        authoritySOLAccount,
        authority,
        1_000_000_000_000 // 1M SOL tokens
      );
      
      await mintTo(
        connection,
        authority,
        usdcMint,
        authorityUSDCAccount,
        authority,
        100_000_000_000_000 // 100M USDC tokens
      );
      
      console.log("✅ Test tokens created and minted");
    } else {
      // Use mainnet token addresses
      solMint = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
      usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC
      console.log("Using mainnet tokens:");
      console.log(`SOL: ${solMint.toString()}`);
      console.log(`USDC: ${usdcMint.toString()}`);
    }
    
    // Step 3: Create Options Markets
    console.log("\n📊 Step 3: Creating Options Markets...");
    
    // SOL/USDC options market
    const solUsdcMarketTx = await client.createOptionsMarket(
      authority,
      1, // Market ID 1
      solMint,
      usdcMint
    );
    console.log(`✅ SOL/USDC Options Market: ${solUsdcMarketTx}`);
    
    // Step 4: Create Sample Options (only for devnet/testnet)
    if (NETWORK !== "mainnet-beta") {
      console.log("\n⚡ Step 4: Creating Sample Options...");
      
      const currentTime = Math.floor(Date.now() / 1000);
      const oneWeek = 7 * 24 * 60 * 60;
      const expirationTime = currentTime + oneWeek;
      
      // Create a call option: SOL at $200 strike, expires in 1 week
      const callOptionResult = await client.writeOption(
        authority,
        1, // Market ID
        solMint,
        usdcMint,
        OptionType.Call,
        200_000_000, // $200 strike (6 decimals)
        expirationTime,
        10_000_000, // 10 SOL worth of contracts
        5_000_000   // $5 premium per contract
      );
      console.log(`✅ Call Option Created: ${callOptionResult.optionContract.toString()}`);
      console.log(`   Transaction: ${callOptionResult.txSignature}`);
      
      // Create a put option: SOL at $180 strike, expires in 1 week
      const putOptionResult = await client.writeOption(
        authority,
        1, // Market ID
        solMint,
        usdcMint,
        OptionType.Put,
        180_000_000, // $180 strike (6 decimals)
        expirationTime,
        10_000_000, // 10 SOL worth of contracts
        8_000_000   // $8 premium per contract
      );
      console.log(`✅ Put Option Created: ${putOptionResult.optionContract.toString()}`);
      console.log(`   Transaction: ${putOptionResult.txSignature}`);
    }
    
    // Step 5: Display Protocol Information
    console.log("\n📈 Step 5: Protocol Information");
    const protocolState = await client.getProtocolState();
    console.log(`Authority: ${protocolState.authority.toString()}`);
    console.log(`Protocol Fee Rate: ${protocolState.protocolFeeRate.toNumber() / 100}%`);
    console.log(`Settlement Fee Rate: ${protocolState.settlementFeeRate.toNumber() / 100}%`);
    console.log(`Liquidation Fee Rate: ${protocolState.liquidationFeeRate.toNumber() / 100}%`);
    console.log(`Total Volume: ${protocolState.totalVolume.toString()}`);
    console.log(`Total Fees Collected: ${protocolState.totalFeesCollected.toString()}`);
    
    const marketData = await client.getOptionsMarket(1);
    console.log(`\nSOL/USDC Market:`);
    console.log(`  Market ID: ${marketData.marketId.toString()}`);
    console.log(`  Underlying: ${marketData.underlyingMint.toString()}`);
    console.log(`  Quote: ${marketData.quoteMint.toString()}`);
    console.log(`  Total Options Written: ${marketData.totalOptionsWritten.toString()}`);
    console.log(`  Total Volume: ${marketData.totalVolume.toString()}`);
    console.log(`  Active: ${marketData.isActive}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      programId: PROGRAM_ID,
      authority: authority.publicKey.toString(),
      protocolState: client.getProtocolStatePDA()[0].toString(),
      markets: {
        solUsdc: {
          marketId: 1,
          underlying: solMint.toString(),
          quote: usdcMint.toString(),
          marketAddress: client.getOptionsMarketPDA(1)[0].toString()
        }
      },
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      `./deployment-${NETWORK}.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Deployment Complete!");
    console.log(`📄 Deployment info saved to deployment-${NETWORK}.json`);
    console.log("\n🔗 Important Addresses:");
    console.log(`Program ID: ${PROGRAM_ID}`);
    console.log(`Protocol State: ${client.getProtocolStatePDA()[0].toString()}`);
    console.log(`SOL/USDC Market: ${client.getOptionsMarketPDA(1)[0].toString()}`);
    
    if (NETWORK !== "mainnet-beta") {
      console.log(`\n🪙 Test Token Addresses:`);
      console.log(`SOL Token: ${solMint.toString()}`);
      console.log(`USDC Token: ${usdcMint.toString()}`);
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Helper function to create and fund a test user
export async function createTestUser(
  connection: Connection,
  authority: Keypair,
  solMint: PublicKey,
  usdcMint: PublicKey,
  name: string = "TestUser"
): Promise<{
  keypair: Keypair;
  solAccount: PublicKey;
  usdcAccount: PublicKey;
}> {
  console.log(`\n👤 Creating ${name}...`);
  
  const user = Keypair.generate();
  
  // Airdrop SOL for transaction fees
  await connection.confirmTransaction(
    await connection.requestAirdrop(user.publicKey, LAMPORTS_PER_SOL)
  );
  
  // Create token accounts
  const solAccount = await createAccount(
    connection,
    user,
    solMint,
    user.publicKey
  );
  
  const usdcAccount = await createAccount(
    connection,
    user,
    usdcMint,
    user.publicKey
  );
  
  // Mint tokens to user
  await mintTo(
    connection,
    authority,
    solMint,
    solAccount,
    authority,
    100_000_000 // 100 SOL tokens
  );
  
  await mintTo(
    connection,
    authority,
    usdcMint,
    usdcAccount,
    authority,
    50_000_000_000 // 50,000 USDC tokens
  );
  
  console.log(`✅ ${name} created:`);
  console.log(`   Public Key: ${user.publicKey.toString()}`);
  console.log(`   SOL Account: ${solAccount.toString()}`);
  console.log(`   USDC Account: ${usdcAccount.toString()}`);
  
  return {
    keypair: user,
    solAccount,
    usdcAccount
  };
}

if (require.main === module) {
  main().catch(console.error);
} 
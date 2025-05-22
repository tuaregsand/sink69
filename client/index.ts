import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccount
} from "@solana/spl-token";
import { SolanaOptionsDex } from "../target/types/solana_options_dex";

export enum OptionType {
  Call = "call",
  Put = "put"
}

export interface OptionContractData {
  writer: PublicKey;
  underlyingMint: PublicKey;
  quoteMint: PublicKey;
  optionType: OptionType;
  strikePrice: BN;
  expirationTimestamp: BN;
  amount: BN;
  premiumPerContract: BN;
  contractsSold: BN;
  isExercised: boolean;
  isExpired: boolean;
  creationTimestamp: BN;
}

export interface BuyerPositionData {
  buyer: PublicKey;
  optionContract: PublicKey;
  contractsOwned: BN;
  premiumPaid: BN;
  isExercised: boolean;
}

export interface ProtocolStateData {
  authority: PublicKey;
  protocolFeeRate: BN;
  settlementFeeRate: BN;
  liquidationFeeRate: BN;
  totalVolume: BN;
  totalFeesCollected: BN;
}

export interface OptionsMarketData {
  marketId: BN;
  underlyingMint: PublicKey;
  quoteMint: PublicKey;
  authority: PublicKey;
  totalOptionsWritten: BN;
  totalVolume: BN;
  isActive: boolean;
}

export class SolanaOptionsClient {
  private program: Program<SolanaOptionsDex>;
  private provider: AnchorProvider;
  
  constructor(
    connection: Connection,
    wallet: anchor.Wallet,
    programId: PublicKey
  ) {
    this.provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(
      require("../target/idl/solana_options_dex.json"),
      programId,
      this.provider
    );
  }
  
  // Initialize the protocol (admin only)
  async initializeProtocol(
    authority: Keypair,
    protocolFeeRate: number = 50, // 0.5%
    settlementFeeRate: number = 10, // 0.1%
    liquidationFeeRate: number = 20 // 0.2%
  ): Promise<string> {
    const [protocolState] = this.getProtocolStatePDA();
    
    const tx = await this.program.methods
      .initializeProtocol(
        new BN(protocolFeeRate),
        new BN(settlementFeeRate),
        new BN(liquidationFeeRate)
      )
      .accounts({
        protocolState,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    
    return tx;
  }
  
  // Create an options market
  async createOptionsMarket(
    authority: Keypair,
    marketId: number,
    underlyingMint: PublicKey,
    quoteMint: PublicKey
  ): Promise<string> {
    const [optionsMarket] = this.getOptionsMarketPDA(marketId);
    
    const tx = await this.program.methods
      .createOptionsMarket(new BN(marketId))
      .accounts({
        optionsMarket,
        underlyingMint,
        quoteMint,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    
    return tx;
  }
  
  // Write an option contract
  async writeOption(
    writer: Keypair,
    marketId: number,
    underlyingMint: PublicKey,
    quoteMint: PublicKey,
    optionType: OptionType,
    strikePrice: number,
    expirationTimestamp: number,
    amount: number,
    premiumPerContract: number
  ): Promise<{ txSignature: string; optionContract: PublicKey }> {
    const [optionsMarket] = this.getOptionsMarketPDA(marketId);
    const [optionContract] = this.getOptionContractPDA(
      writer.publicKey,
      underlyingMint,
      Math.floor(Date.now() / 1000)
    );
    
    const [collateralVault] = this.getCollateralVaultPDA(optionContract);
    const [quoteCollateralVault] = this.getQuoteCollateralVaultPDA(optionContract);
    
    // Get or create writer's token accounts
    const writerUnderlyingAccount = await getAssociatedTokenAddress(
      underlyingMint,
      writer.publicKey
    );
    const writerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      writer.publicKey
    );
    
    const tx = await this.program.methods
      .writeOption(
        optionType === OptionType.Call ? { call: {} } : { put: {} },
        new BN(strikePrice),
        new BN(expirationTimestamp),
        new BN(amount),
        new BN(premiumPerContract)
      )
      .accounts({
        optionContract,
        optionsMarket,
        underlyingMint,
        quoteMint,
        collateralVault,
        quoteCollateralVault,
        writerTokenAccount: writerUnderlyingAccount,
        writerQuoteAccount,
        writer: writer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([writer])
      .rpc();
    
    return { txSignature: tx, optionContract };
  }
  
  // Buy an option contract
  async buyOption(
    buyer: Keypair,
    optionContract: PublicKey,
    contractsToBuy: number,
    quoteMint: PublicKey
  ): Promise<{ txSignature: string; buyerPosition: PublicKey }> {
    const [protocolState] = this.getProtocolStatePDA();
    const [buyerPosition] = this.getBuyerPositionPDA(buyer.publicKey, optionContract);
    
    // Get buyer's token accounts
    const buyerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      buyer.publicKey
    );
    
    // Get option contract data to find writer
    const optionData = await this.getOptionContract(optionContract);
    const writerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      optionData.writer
    );
    
    // Get protocol fee account
    const protocolStateData = await this.getProtocolState();
    const protocolFeeAccount = await getAssociatedTokenAddress(
      quoteMint,
      protocolStateData.authority
    );
    
    const tx = await this.program.methods
      .buyOption(new BN(contractsToBuy))
      .accounts({
        optionContract,
        protocolState,
        buyerPosition,
        buyerQuoteAccount,
        writerQuoteAccount,
        protocolFeeAccount,
        buyer: buyer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    return { txSignature: tx, buyerPosition };
  }
  
  // Exercise an option
  async exerciseOption(
    buyer: Keypair,
    optionContract: PublicKey,
    underlyingMint: PublicKey,
    quoteMint: PublicKey
  ): Promise<string> {
    const [protocolState] = this.getProtocolStatePDA();
    const [buyerPosition] = this.getBuyerPositionPDA(buyer.publicKey, optionContract);
    const [collateralVault] = this.getCollateralVaultPDA(optionContract);
    const [quoteCollateralVault] = this.getQuoteCollateralVaultPDA(optionContract);
    
    // Get token accounts
    const buyerUnderlyingAccount = await getAssociatedTokenAddress(
      underlyingMint,
      buyer.publicKey
    );
    const buyerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      buyer.publicKey
    );
    
    // Get option contract data to find writer
    const optionData = await this.getOptionContract(optionContract);
    const writerUnderlyingAccount = await getAssociatedTokenAddress(
      underlyingMint,
      optionData.writer
    );
    const writerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      optionData.writer
    );
    
    // Get protocol fee account
    const protocolStateData = await this.getProtocolState();
    const protocolFeeAccount = await getAssociatedTokenAddress(
      quoteMint,
      protocolStateData.authority
    );
    
    const tx = await this.program.methods
      .exerciseOption()
      .accounts({
        optionContract,
        buyerPosition,
        protocolState,
        collateralVault,
        quoteCollateralVault,
        buyerTokenAccount: buyerUnderlyingAccount,
        buyerQuoteAccount,
        writerTokenAccount: writerUnderlyingAccount,
        writerQuoteAccount,
        protocolFeeAccount,
        buyer: buyer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();
    
    return tx;
  }
  
  // Claim expired option (for writers)
  async claimExpiredOption(
    writer: Keypair,
    optionContract: PublicKey,
    underlyingMint: PublicKey,
    quoteMint: PublicKey
  ): Promise<string> {
    const [collateralVault] = this.getCollateralVaultPDA(optionContract);
    const [quoteCollateralVault] = this.getQuoteCollateralVaultPDA(optionContract);
    
    const writerUnderlyingAccount = await getAssociatedTokenAddress(
      underlyingMint,
      writer.publicKey
    );
    const writerQuoteAccount = await getAssociatedTokenAddress(
      quoteMint,
      writer.publicKey
    );
    
    const tx = await this.program.methods
      .claimExpiredOption()
      .accounts({
        optionContract,
        collateralVault,
        quoteCollateralVault,
        writerTokenAccount: writerUnderlyingAccount,
        writerQuoteAccount,
        writer: writer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([writer])
      .rpc();
    
    return tx;
  }
  
  // Getter methods for account data
  async getProtocolState(): Promise<ProtocolStateData> {
    const [protocolState] = this.getProtocolStatePDA();
    return await this.program.account.protocolState.fetch(protocolState);
  }
  
  async getOptionsMarket(marketId: number): Promise<OptionsMarketData> {
    const [optionsMarket] = this.getOptionsMarketPDA(marketId);
    return await this.program.account.optionsMarket.fetch(optionsMarket);
  }
  
  async getOptionContract(optionContract: PublicKey): Promise<OptionContractData> {
    const data = await this.program.account.optionContract.fetch(optionContract);
    return {
      ...data,
      optionType: data.optionType.call ? OptionType.Call : OptionType.Put
    };
  }
  
  async getBuyerPosition(buyer: PublicKey, optionContract: PublicKey): Promise<BuyerPositionData> {
    const [buyerPosition] = this.getBuyerPositionPDA(buyer, optionContract);
    return await this.program.account.buyerPosition.fetch(buyerPosition);
  }
  
  // Get all option contracts for a market
  async getOptionContractsForMarket(marketId: number): Promise<OptionContractData[]> {
    const [optionsMarket] = this.getOptionsMarketPDA(marketId);
    const contracts = await this.program.account.optionContract.all([
      {
        memcmp: {
          offset: 8 + 32, // Skip discriminator and writer pubkey
          bytes: optionsMarket.toBase58(),
        }
      }
    ]);
    
    return contracts.map(contract => ({
      ...contract.account,
      optionType: contract.account.optionType.call ? OptionType.Call : OptionType.Put
    }));
  }
  
  // Get all positions for a buyer
  async getBuyerPositions(buyer: PublicKey): Promise<BuyerPositionData[]> {
    const positions = await this.program.account.buyerPosition.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: buyer.toBase58(),
        }
      }
    ]);
    
    return positions.map(position => position.account);
  }
  
  // PDA calculation methods
  getProtocolStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_state")],
      this.program.programId
    );
  }
  
  getOptionsMarketPDA(marketId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("options_market"), new BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }
  
  getOptionContractPDA(
    writer: PublicKey,
    underlyingMint: PublicKey,
    timestamp: number
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("option_contract"),
        writer.toBuffer(),
        underlyingMint.toBuffer(),
        new BN(timestamp).toArrayLike(Buffer, "le", 8)
      ],
      this.program.programId
    );
  }
  
  getBuyerPositionPDA(buyer: PublicKey, optionContract: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("buyer_position"),
        buyer.toBuffer(),
        optionContract.toBuffer()
      ],
      this.program.programId
    );
  }
  
  getCollateralVaultPDA(optionContract: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("collateral"), optionContract.toBuffer()],
      this.program.programId
    );
  }
  
  getQuoteCollateralVaultPDA(optionContract: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("quote_collateral"), optionContract.toBuffer()],
      this.program.programId
    );
  }
  
  // Utility methods
  calculatePremium(strikePrice: BN, amount: BN, premiumPerContract: BN): BN {
    return premiumPerContract.mul(amount);
  }
  
  calculateProtocolFee(premium: BN, feeRate: BN): BN {
    return premium.mul(feeRate).div(new BN(10000));
  }
  
  calculateCollateralRequired(
    optionType: OptionType,
    strikePrice: BN,
    amount: BN
  ): BN {
    if (optionType === OptionType.Call) {
      return amount; // Underlying tokens
    } else {
      return strikePrice.mul(amount); // Quote tokens
    }
  }
  
  isOptionExpired(expirationTimestamp: BN): boolean {
    const now = Math.floor(Date.now() / 1000);
    return new BN(now).gt(expirationTimestamp);
  }
  
  timeToExpiration(expirationTimestamp: BN): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expirationTimestamp.toNumber() - now);
  }
  
  // Market data helpers
  async getActiveOptionsForUnderlying(
    underlyingMint: PublicKey
  ): Promise<OptionContractData[]> {
    const contracts = await this.program.account.optionContract.all([
      {
        memcmp: {
          offset: 8 + 32 + 32, // Skip discriminator, writer, and underlying_mint check
          bytes: underlyingMint.toBase58(),
        }
      }
    ]);
    
    const now = Math.floor(Date.now() / 1000);
    return contracts
      .map(contract => ({
        ...contract.account,
        optionType: contract.account.optionType.call ? OptionType.Call : OptionType.Put
      }))
      .filter(contract => 
        !contract.isExercised && 
        !contract.isExpired && 
        contract.expirationTimestamp.toNumber() > now
      );
  }
}

// Factory function to create client
export function createOptionsClient(
  connection: Connection,
  wallet: anchor.Wallet,
  programId?: PublicKey
): SolanaOptionsClient {
  const defaultProgramId = new PublicKey("E1TXVekuewkrgWspyhUToYeZzucutnEqyVG9eFf8WTKq");
  return new SolanaOptionsClient(connection, wallet, programId || defaultProgramId);
} 
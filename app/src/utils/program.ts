import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { SolanaOptionsDex } from '../types/solana_options_dex';

export const PROGRAM_ID = new PublicKey('E1TXVekuewkrgWspyhUToYeZzucutnEqyVG9eFf8WTKq');

export class OptionsDeXClient {
  public connection: Connection;
  public wallet: any;
  public provider: AnchorProvider;
  public program: Program<Idl> | null = null;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    
    this.provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );

    // Program will be initialized when deployed to devnet
    // For now, we'll use mock data to demonstrate the UI
    try {
      // This will be uncommented when the program is deployed
      // this.program = new Program(IDL as unknown as Idl, PROGRAM_ID, this.provider);
      console.log('Options DEX Client initialized with mock data for UI demonstration');
    } catch (error) {
      console.warn('Program not available, using mock data:', error);
    }
  }

  // Get Protocol State PDA
  getProtocolStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_state')],
      PROGRAM_ID
    );
  }

  // Get Options Market PDA
  getOptionsMarketPDA(marketId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('options_market'), marketId.toArrayLike(Buffer, 'le', 8)],
      PROGRAM_ID
    );
  }

  // Get Option Contract PDA
  getOptionContractPDA(
    writer: PublicKey,
    underlyingMint: PublicKey,
    timestamp: BN
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('option_contract'),
        writer.toBuffer(),
        underlyingMint.toBuffer(),
        timestamp.toArrayLike(Buffer, 'le', 8)
      ],
      PROGRAM_ID
    );
  }

  // Get Buyer Position PDA
  getBuyerPositionPDA(
    buyer: PublicKey,
    optionContract: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('buyer_position'),
        buyer.toBuffer(),
        optionContract.toBuffer()
      ],
      PROGRAM_ID
    );
  }

  // Get Collateral Vault PDA
  getCollateralVaultPDA(optionContract: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('collateral'), optionContract.toBuffer()],
      PROGRAM_ID
    );
  }

  // Get Quote Collateral Vault PDA
  getQuoteCollateralVaultPDA(optionContract: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('quote_collateral'), optionContract.toBuffer()],
      PROGRAM_ID
    );
  }

  // Initialize Protocol - Ready for deployment
  async initializeProtocol(
    protocolFeeRate: BN,
    settlementFeeRate: BN,
    liquidationFeeRate: BN
  ) {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!this.program) {
      throw new Error('🚀 Ready to deploy! Deploy the program to devnet first:\n\nanchor deploy --provider.cluster devnet\n\nThen update the PROGRAM_ID in src/utils/program.ts');
    }

    const [protocolState] = this.getProtocolStatePDA();

    try {
      const tx = await this.program.methods
        .initializeProtocol(protocolFeeRate, settlementFeeRate, liquidationFeeRate)
        .accounts({
          protocolState,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing protocol:', error);
      throw new Error('Failed to initialize protocol. Make sure you have deployed the program to devnet first.');
    }
  }

  // Create Options Market - Ready for deployment
  async createOptionsMarket(
    marketId: BN,
    underlyingMint: PublicKey,
    quoteMint: PublicKey
  ) {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!this.program) {
      throw new Error('🚀 Ready to deploy! Deploy the program to devnet first:\n\nanchor deploy --provider.cluster devnet\n\nThen update the PROGRAM_ID in src/utils/program.ts');
    }

    const [optionsMarket] = this.getOptionsMarketPDA(marketId);

    try {
      const tx = await this.program.methods
        .createOptionsMarket(marketId)
        .accounts({
          optionsMarket,
          underlyingMint,
          quoteMint,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error creating options market:', error);
      throw new Error('Failed to create options market. Make sure the protocol is initialized first.');
    }
  }

  // Write Option - Ready for deployment
  async writeOption(params: {
    timestamp: BN;
    optionType: { call: {} } | { put: {} };
    strikePrice: BN;
    expirationTimestamp: BN;
    amount: BN;
    premiumPerContract: BN;
    underlyingMint: PublicKey;
    quoteMint: PublicKey;
    writerTokenAccount: PublicKey;
    writerQuoteAccount: PublicKey;
    optionsMarket: PublicKey;
  }) {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!this.program) {
      throw new Error('🚀 Ready to deploy! Deploy the program to devnet first:\n\nanchor deploy --provider.cluster devnet\n\nThen update the PROGRAM_ID in src/utils/program.ts');
    }

    const [optionContract] = this.getOptionContractPDA(
      this.wallet.publicKey,
      params.underlyingMint,
      params.timestamp
    );
    const [collateralVault] = this.getCollateralVaultPDA(optionContract);
    const [quoteCollateralVault] = this.getQuoteCollateralVaultPDA(optionContract);

    try {
      const tx = await this.program.methods
        .writeOption(
          params.timestamp,
          params.optionType,
          params.strikePrice,
          params.expirationTimestamp,
          params.amount,
          params.premiumPerContract
        )
        .accounts({
          optionContract,
          optionsMarket: params.optionsMarket,
          underlyingMint: params.underlyingMint,
          quoteMint: params.quoteMint,
          collateralVault,
          quoteCollateralVault,
          writerTokenAccount: params.writerTokenAccount,
          writerQuoteAccount: params.writerQuoteAccount,
          writer: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error writing option:', error);
      throw new Error('Failed to write option. Make sure you have sufficient collateral and the market exists.');
    }
  }

  // Buy Option - Ready for deployment
  async buyOption(params: {
    contractsToBuy: BN;
    optionContract: PublicKey;
    buyerQuoteAccount: PublicKey;
    writerQuoteAccount: PublicKey;
    protocolFeeAccount: PublicKey;
  }) {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!this.program) {
      throw new Error('🚀 Ready to deploy! Deploy the program to devnet first:\n\nanchor deploy --provider.cluster devnet\n\nThen update the PROGRAM_ID in src/utils/program.ts');
    }

    const [protocolState] = this.getProtocolStatePDA();
    const [buyerPosition] = this.getBuyerPositionPDA(
      this.wallet.publicKey,
      params.optionContract
    );

    try {
      const tx = await this.program.methods
        .buyOption(params.contractsToBuy)
        .accounts({
          optionContract: params.optionContract,
          protocolState,
          buyerPosition,
          buyerQuoteAccount: params.buyerQuoteAccount,
          writerQuoteAccount: params.writerQuoteAccount,
          protocolFeeAccount: params.protocolFeeAccount,
          buyer: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error buying option:', error);
      throw new Error('Failed to buy option. Make sure you have sufficient funds and the option is available.');
    }
  }

  // Exercise Option - Ready for deployment
  async exerciseOption(params: {
    optionContract: PublicKey;
    buyerTokenAccount: PublicKey;
    buyerQuoteAccount: PublicKey;
    writerTokenAccount: PublicKey;
    writerQuoteAccount: PublicKey;
    protocolFeeAccount: PublicKey;
  }) {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!this.program) {
      throw new Error('🚀 Ready to deploy! Deploy the program to devnet first:\n\nanchor deploy --provider.cluster devnet\n\nThen update the PROGRAM_ID in src/utils/program.ts');
    }

    const [buyerPosition] = this.getBuyerPositionPDA(
      this.wallet.publicKey,
      params.optionContract
    );
    const [protocolState] = this.getProtocolStatePDA();
    const [collateralVault] = this.getCollateralVaultPDA(params.optionContract);
    const [quoteCollateralVault] = this.getQuoteCollateralVaultPDA(params.optionContract);

    try {
      const tx = await this.program.methods
        .exerciseOption()
        .accounts({
          optionContract: params.optionContract,
          buyerPosition,
          protocolState,
          collateralVault,
          quoteCollateralVault,
          buyerTokenAccount: params.buyerTokenAccount,
          buyerQuoteAccount: params.buyerQuoteAccount,
          writerTokenAccount: params.writerTokenAccount,
          writerQuoteAccount: params.writerQuoteAccount,
          protocolFeeAccount: params.protocolFeeAccount,
          buyer: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error exercising option:', error);
      throw new Error('Failed to exercise option. Make sure the option is in-the-money and not expired.');
    }
  }

  // Fetch Protocol State - Ready for real data after deployment
  async fetchProtocolState() {
    if (this.program) {
      try {
        const [protocolState] = this.getProtocolStatePDA();
        const state = await this.program.account.protocolState.fetch(protocolState);
        return state;
      } catch (error) {
        console.warn('Protocol not initialized yet, returning mock data:', error);
      }
    }
    
    // Return mock data for UI demonstration
    console.log('📊 Displaying mock protocol data for UI demonstration');
    return {
      authority: this.wallet?.publicKey || PROGRAM_ID,
      protocolFeeRate: new BN(50), // 0.5%
      settlementFeeRate: new BN(10), // 0.1%
      liquidationFeeRate: new BN(20), // 0.2%
      totalVolume: new BN(7_500_000_000_000), // $7.5M (scaled by 1M)
      totalFeesCollected: new BN(37_500_000_000), // $37.5K (scaled by 1M)
      bump: 254
    };
  }

  // Fetch Options Market - Ready for real data after deployment
  async fetchOptionsMarket(marketId: BN) {
    if (this.program) {
      try {
        const [optionsMarket] = this.getOptionsMarketPDA(marketId);
        const market = await this.program.account.optionsMarket.fetch(optionsMarket);
        return market;
      } catch (error) {
        console.warn('Options market not found, returning mock data:', error);
      }
    }
    
    // Return mock data for UI demonstration
    console.log('📊 Displaying mock market data for UI demonstration');
    return {
      marketId,
      underlyingMint: new PublicKey('So11111111111111111111111111111111111111112'),
      quoteMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      authority: this.wallet?.publicKey || PROGRAM_ID,
      totalOptionsWritten: new BN(150),
      totalVolume: new BN(7_500_000_000_000),
      isActive: true,
      bump: 254
    };
  }

  // Fetch Option Contract - Ready for real data after deployment
  async fetchOptionContract(optionContract: PublicKey) {
    if (this.program) {
      try {
        const contract = await this.program.account.optionContract.fetch(optionContract);
        return contract;
      } catch (error) {
        console.warn('Option contract not found, returning mock data:', error);
      }
    }
    
    // Return mock data for UI demonstration
    console.log('📊 Displaying mock option contract data for UI demonstration');
    return {
      writer: this.wallet?.publicKey || PROGRAM_ID,
      underlyingMint: new PublicKey('So11111111111111111111111111111111111111112'),
      quoteMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      optionType: { call: {} },
      strikePrice: new BN(100_000_000), // $100
      expirationTimestamp: new BN(Date.now() + 7 * 24 * 60 * 60 * 1000),
      amount: new BN(1_000_000), // 1 SOL
      premiumPerContract: new BN(5_000_000), // $5
      contractsSold: new BN(0),
      isExercised: false,
      isExpired: false,
      creationTimestamp: new BN(Date.now()),
      bump: 254
    };
  }

  // Fetch Buyer Position - Ready for real data after deployment
  async fetchBuyerPosition(buyer: PublicKey, optionContract: PublicKey) {
    if (this.program) {
      try {
        const [buyerPosition] = this.getBuyerPositionPDA(buyer, optionContract);
        const position = await this.program.account.buyerPosition.fetch(buyerPosition);
        return position;
      } catch (error) {
        console.warn('Buyer position not found, returning mock data:', error);
      }
    }
    
    // Return mock data for UI demonstration
    console.log('📊 Displaying mock buyer position data for UI demonstration');
    return {
      buyer,
      optionContract,
      contractsOwned: new BN(1),
      premiumPaid: new BN(5_000_000), // $5
      isExercised: false,
      bump: 254
    };
  }

  // Get all option contracts for a writer - Ready for real data after deployment
  async getWriterOptionContracts(writer: PublicKey) {
    if (this.program) {
      try {
        const contracts = await this.program.account.optionContract.all([
          {
            memcmp: {
              offset: 8, // Discriminator size
              bytes: writer.toBase58(),
            },
          },
        ]);
        return contracts;
      } catch (error) {
        console.warn('Error fetching writer option contracts:', error);
      }
    }
    
    console.log('📊 No option contracts data available - deploy program for real data');
    return [];
  }

  // Get all buyer positions for a buyer - Ready for real data after deployment
  async getBuyerPositions(buyer: PublicKey) {
    if (this.program) {
      try {
        const positions = await this.program.account.buyerPosition.all([
          {
            memcmp: {
              offset: 8, // Discriminator size
              bytes: buyer.toBase58(),
            },
          },
        ]);
        return positions;
      } catch (error) {
        console.warn('Error fetching buyer positions:', error);
      }
    }
    
    console.log('📊 No buyer positions data available - deploy program for real data');
    return [];
  }
}

// Utility functions
export const formatTokenAmount = (amount: BN, decimals: number = 6): number => {
  return amount.toNumber() / Math.pow(10, decimals);
};

export const parseTokenAmount = (amount: number, decimals: number = 6): BN => {
  return new BN(amount * Math.pow(10, decimals));
};

export const formatOptionType = (optionType: any): string => {
  return optionType.call ? 'CALL' : 'PUT';
};

export const formatTimestamp = (timestamp: BN): Date => {
  return new Date(timestamp.toNumber());
};

// Helper function to get associated token address
export const getAssociatedTokenAddressForMint = async (
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> => {
  return await getAssociatedTokenAddress(mint, owner);
};

// Constants for common mints
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); 
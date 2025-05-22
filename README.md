# Solana Options DEX - Decentralized Options Trading Platform

![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-00A3E1?style=for-the-badge&logo=anchor&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

A production-ready decentralized options trading platform built on Solana. Write, buy, and exercise options contracts for any SPL token with automated settlement and fee collection. This repository contains the Anchor smart contract and a Next.js frontend application.

## Features
- **Decentralized Options Trading**: Write and trade call/put options for SPL tokens.
- **Automated Settlement**: Smart contract-based option exercise and expiration.
- **Collateral Management**: Secure collateral handling for writers.
- **Permissionless Markets**: Ability to create options markets for various token pairs.
- **Flexible Terms**: Customizable strike prices and expiration dates.
- **Revenue Generation**: Protocol fees on premiums and settlements.
- **Frontend Application**: A user-friendly Next.js application for interacting with the protocol (located in the `/app` directory).

## Architecture
The core logic is implemented as an Anchor-based Solana program.

### Smart Contract Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Protocol State │    │ Options Markets │    │Option Contracts │
│                 │    │                 │    │                 │
│ • Authority     │    │ • Market ID     │    │ • Writer        │
│ • Fee Rates     │    │ • Token Pairs   │    │ • Strike Price  │
│ • Total Volume  │    │ • Statistics    │    │ • Expiration    │
│ • Fees Collected│    │ • Active Status │    │ • Collateral    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Buyer Positions │
                    │                 │
                    │ • Contracts Own │
                    │ • Premium Paid  │
                    │ • Exercise State│
                    └─────────────────┘
```

## Revenue Model
The platform generates revenue through:
- **Protocol Fee**: Applied on option premiums (e.g., 0.5%).
- **Settlement Fee**: Applied on exercised options (e.g., 0.1%).
- **Liquidation Fee**: Applied on expired options (e.g., 0.2%).

These fees contribute to the sustainability and development of the protocol.

## Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (v0.29.0 or newer recommended, this project uses `0.29.0`)
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)

### Project Structure
- `/programs/solana-options-dex`: Anchor smart contract.
- `/app`: Next.js frontend application.
- `/tests`: Integration tests for the smart contract.
- `/client`: TypeScript client for interacting with the smart contract.

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/tuaregsand/sink69.git # Or your fork
    cd sink69
    ```

2.  **Install Workspace Dependencies (Root):**
    This installs dependencies for the Anchor program and general workspace tools.
    ```bash
    yarn install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd app
    yarn install
    cd ..
    ```

### Smart Contract Development

1.  **Build the Anchor Program:**
    ```bash
    anchor build
    ```

2.  **Run Smart Contract Tests:**
    ```bash
    anchor test
    ```

3.  **Local Validator Setup:**
    Open a new terminal:
    ```bash
    solana-test-validator
    ```
    In your main terminal:
    ```bash
    solana config set --url localhost
    # Configure your keypair if needed, e.g., for a fresh validator
    # solana-keygen new --outfile ~/.config/solana/id.json --force 
    # anchor keys list # To see the program ID after build
    ```

4.  **Deploy Program Locally:**
    ```bash
    anchor deploy
    ```
    *(Note: After the first deploy, take note of the program ID. You might need to update it in `/declare_id.sh` and `Anchor.toml` and `lib.rs` if it changes, then rebuild and redeploy.)*

### Frontend Development

1.  **Navigate to the app directory:**
    ```bash
    cd app
    ```

2.  **Set up Environment Variables:**
    Create a `.env.local` file in the `app` directory by copying `.env.example` (if it exists) or by creating a new one.
    Update `NEXT_PUBLIC_PROGRAM_ID` with your deployed program ID (from `anchor deploy` or `anchor keys list`).
    Example `.env.local`:
    ```env
    NEXT_PUBLIC_CLUSTER='devnet' # or 'http://localhost:8899' for local
    NEXT_PUBLIC_RPC_ENDPOINT='https://api.devnet.solana.com' # or 'http://localhost:8899' for local
    NEXT_PUBLIC_PROGRAM_ID='YOUR_PROGRAM_ID_HERE' 
    ```

3.  **Run the Frontend Development Server:**
    ```bash
    yarn dev
    ```
    The application should be available at `http://localhost:3000`.

## Deployment

### Devnet

1.  **Configure Solana CLI for Devnet:**
    ```bash
    solana config set --url https://api.devnet.solana.com
    solana config set --keypair ~/.config/solana/id.json # Ensure this keypair is funded
    solana airdrop 1 # If needed
    ```

2.  **Deploy the Program to Devnet:**
    ```bash
    anchor deploy --provider.cluster devnet
    ```
    Note the program ID.

3.  **Update Frontend Configuration:**
    Ensure `NEXT_PUBLIC_PROGRAM_ID` in `app/.env.local` is set to the new Devnet program ID and `NEXT_PUBLIC_CLUSTER` is `devnet`.

4.  **Deploy Frontend (Example using Vercel/Netlify):**
    Connect your Git repository to a platform like Vercel or Netlify for continuous deployment. Configure environment variables on the platform.

### Mainnet
Deploying to Mainnet requires significant caution, audits, and planning.
1.  **Thoroughly Audit Your Smart Contract.**
2.  **Configure Solana CLI for Mainnet:**
    ```bash
    solana config set --url https://api.mainnet-beta.solana.com
    solana config set --keypair YOUR_MAINNET_KEYPAIR.json # Securely managed keypair
    ```
3.  **Ensure Sufficient Funding:** Your deployment keypair will need SOL for transaction fees.
4.  **Deploy the Program to Mainnet:**
    ```bash
    anchor deploy --provider.cluster mainnet-beta
    ```
5.  **Update Frontend Configuration for Mainnet.**
6.  **Deploy Frontend to Production Environment.**

## Integration Options

The Solana Options DEX protocol can be integrated in several ways:

### 1. 📱 Web Frontend (Recommended for End Users)
Build a user-friendly React/Next.js frontend for options trading. The `/app` directory in this repository provides a production-ready starting point.
**Key Features to Build/Extend:**
- Options Dashboard: View available options markets.
- Trading Interface: Buy/sell options, potentially with price charts.
- Portfolio Management: Track user positions and P&L.
- Exercise Interface: Allow users to exercise their options.
- Mobile Responsive Design.

**Recommended Tech Stack (as used in `/app`):**
- Framework: Next.js
- Wallet: `@solana/wallet-adapter-react`
- UI: Tailwind CSS
- State Management: React Context/Zustand

### 2. 🔧 Direct Programmatic Access (Using the TypeScript Client)
Utilize the TypeScript client located in the `/client` directory for direct interaction with the smart contract. This is ideal for scripts, bots, or backend integrations.

**Quick Start with Programmatic Access:**
```typescript
// Example: client/client.ts or a similar setup
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SolanaOptionsDex, IDL } from "../target/types/solana_options_dex"; // Adjust path as needed

async function main() {
  // Configure connection and wallet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletKeypair = Keypair.generate(); // Replace with your actual wallet
  
  // Airdrop SOL to wallet if on devnet/localnet
  // const महिलाएं = await connection.requestAirdrop(walletKeypair.publicKey, anchor.web3.LAMPORTS_PER_SOL);
  // await connection.confirmTransaction(airdropSignature);

  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(walletKeypair),
    AnchorProvider.defaultOptions()
  );
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE"); // Replace with your deployed program ID
  const program = new Program<SolanaOptionsDex>(IDL, programId, provider);

  // Example: Initialize protocol (if not already done by deployer)
  /*
  try {
    const tx = await program.methods
      .initializeProtocol(
        new anchor.BN(50), // 0.5% protocol fee (50 basis points)
        new anchor.BN(10), // 0.1% settlement fee (10 basis points)
        new anchor.BN(20)  // 0.2% liquidation fee (20 basis points)
      )
      .accounts({
        protocolState: /* PDA for protocol state */",
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Protocol initialized, transaction:", tx);
  } catch (err) {
    console.error("Failed to initialize protocol (may already be initialized):", err);
  }
  */

  // Example: Write a call option
  // Ensure you have the mint addresses for underlying (e.g., SOL) and quote (e.g., USDC)
  // Ensure the options market for these tokens is created
  /*
  const underlyingMint = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
  const quoteMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC on Devnet

  const writeTx = await program.methods
    .writeOption(
      new anchor.BN(Date.now()), // Unique timestamp for the option
      { call: {} },              // Option type: Call
      new anchor.BN(100 * 1e6),   // Strike price: 100 USDC (assuming 6 decimals for USDC)
      new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), // Expiration: 7 days from now
      new anchor.BN(1 * 1e9),     // Amount: 1 SOL (assuming 9 decimals for SOL)
      new anchor.BN(5 * 1e6)      // Premium: 5 USDC per contract
    )
    .accounts({
      // ... required accounts for writeOption ...
      // optionMarket, writer, writerUnderlyingAccount, writerQuoteAccount, 
      // optionContract, underlyingMint, quoteMint, tokenProgram, systemProgram
    })
    .signers([walletKeypair]) // If writer is a new keypair
    .rpc();
  console.log("Option written, transaction:", writeTx);
  */
}

main().then(() => console.log("Script finished.")).catch(err => console.error(err));
```
*(Note: The above programmatic example is illustrative. You'll need to set up PDAs, token accounts, and ensure markets exist. Refer to `/tests` for detailed examples.)*

### 3. 🏢 Enterprise Integration
Integrate the Solana Options DEX protocol into existing DeFi platforms to offer options trading alongside other services. The TypeScript client can be used as a basis for such integrations.

### 4. 🤖 Trading Bot Integration
Develop automated trading strategies (e.g., market making, arbitrage) by leveraging the programmatic access provided by the client SDK.

## API Reference (Core Smart Contract Functions)
- `initialize_protocol(protocol_fee, settlement_fee, liquidation_fee)`: Sets up global protocol parameters. Typically called once by the authority.
- `create_options_market(market_id, underlying_mint, quote_mint)`: Creates a new options market for a specific pair of SPL tokens.
- `write_option(timestamp, option_type, strike_price, expiration_timestamp, amount, premium_per_contract)`: Allows a user (writer) to create a new option contract, locking collateral.
- `buy_option(option_contract_pubkey, contracts_to_buy, expected_premium)`: Allows a user to purchase available option contracts.
- `exercise_option(option_contract_pubkey, buyer_position_pubkey)`: Allows the holder of an option to exercise it before or at expiration if it's in-the-money.
- `claim_expired_option_collateral(option_contract_pubkey)`: Allows the writer of an expired and unexercised option to reclaim their locked collateral.
- `settle_fees(option_contract_pubkey)`: (If applicable, or part of other functions) Handles the distribution of collected fees.

*(For detailed account structures and function signatures, refer to the IDL in `target/types/solana_options_dex.ts` and the Rust code in `programs/solana-options-dex/src/lib.rs`)*

## Revenue Opportunities
- **For Developers/Integrators**:
    - Transaction Fees: Potentially add small service fees on top of protocol fees for UIs or services you build.
    - Premium Features: Offer advanced analytics, automated strategies, or specialized interfaces.
- **For Liquidity Providers/Traders**:
    - Option Writing: Earn premiums by selling (writing) options.
    - Arbitrage: Capitalize on price discrepancies.
    - Market Making: Provide liquidity to earn from the bid-ask spread and premiums.

## Contributing
Contributions are welcome! Please follow standard Git practices:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a Pull Request.

Please ensure your code is well-tested and follows the existing coding style.

## License
This project is licensed under the MIT License - see the LICENSE file for details (if one exists, otherwise assume MIT).


## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Options trading involves substantial risk and may not be suitable for all investors. Please ensure you understand the risks before participating. The developers are not responsible for any financial losses incurred through the use of this platform.

---

**Built with ❤️ for the Solana ecosystem** 
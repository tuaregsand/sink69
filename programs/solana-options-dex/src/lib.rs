use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("E1TXVekuewkrgWspyhUToYeZzucutnEqyVG9eFf8WTKq");

#[program]
pub mod solana_options_dex {
    use super::*;

    /// Initialize the global protocol state
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_rate: u64, // basis points (e.g., 50 = 0.5%)
        settlement_fee_rate: u64,
        liquidation_fee_rate: u64,
    ) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.authority = ctx.accounts.authority.key();
        protocol_state.protocol_fee_rate = protocol_fee_rate;
        protocol_state.settlement_fee_rate = settlement_fee_rate;
        protocol_state.liquidation_fee_rate = liquidation_fee_rate;
        protocol_state.total_volume = 0;
        protocol_state.total_fees_collected = 0;
        protocol_state.bump = ctx.bumps.protocol_state;

        msg!("Protocol initialized with fee rates: {}%, {}%, {}%", 
             protocol_fee_rate as f64 / 100.0,
             settlement_fee_rate as f64 / 100.0,
             liquidation_fee_rate as f64 / 100.0
        );
        Ok(())
    }

    /// Create a new options market for a specific underlying token
    pub fn create_options_market(
        ctx: Context<CreateOptionsMarket>,
        market_id: u64,
    ) -> Result<()> {
        let options_market = &mut ctx.accounts.options_market;
        options_market.market_id = market_id;
        options_market.underlying_mint = ctx.accounts.underlying_mint.key();
        options_market.quote_mint = ctx.accounts.quote_mint.key();
        options_market.authority = ctx.accounts.authority.key();
        options_market.total_options_written = 0;
        options_market.total_volume = 0;
        options_market.is_active = true;
        options_market.bump = ctx.bumps.options_market;

        msg!("Options market created for underlying: {}", options_market.underlying_mint);
        Ok(())
    }

    /// Write (sell) a new option contract
    pub fn write_option(
        ctx: Context<WriteOption>,
        _timestamp_seed: i64,
        option_type: OptionType,
        strike_price: u64,
        expiration_timestamp: i64,
        amount: u64,
        premium_per_contract: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(expiration_timestamp > clock.unix_timestamp, OptionsError::ExpirationInPast);
        require!(amount > 0, OptionsError::InvalidAmount);
        require!(premium_per_contract > 0, OptionsError::InvalidPremium);

        let option_contract = &mut ctx.accounts.option_contract;
        option_contract.writer = ctx.accounts.writer.key();
        option_contract.underlying_mint = ctx.accounts.underlying_mint.key();
        option_contract.quote_mint = ctx.accounts.quote_mint.key();
        option_contract.option_type = option_type.clone();
        option_contract.strike_price = strike_price;
        option_contract.expiration_timestamp = expiration_timestamp;
        option_contract.amount = amount;
        option_contract.premium_per_contract = premium_per_contract;
        option_contract.contracts_sold = 0;
        option_contract.is_exercised = false;
        option_contract.is_expired = false;
        option_contract.creation_timestamp = clock.unix_timestamp;
        option_contract.bump = ctx.bumps.option_contract;

        // Transfer collateral based on option type
        match option_type {
            OptionType::Call => {
                // For calls, lock underlying tokens as collateral
                let transfer_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.writer_token_account.to_account_info(),
                        to: ctx.accounts.collateral_vault.to_account_info(),
                        authority: ctx.accounts.writer.to_account_info(),
                    },
                );
                token::transfer(transfer_ctx, amount)?;
            }
            OptionType::Put => {
                // For puts, lock quote tokens as collateral (strike_price * amount / 1_000_000)
                let collateral_amount = strike_price
                    .checked_mul(amount)
                    .ok_or(OptionsError::MathOverflow)?
                    .checked_div(1_000_000) // Normalize decimal scaling
                    .ok_or(OptionsError::MathOverflow)?;
                
                let transfer_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.writer_quote_account.to_account_info(),
                        to: ctx.accounts.quote_collateral_vault.to_account_info(),
                        authority: ctx.accounts.writer.to_account_info(),
                    },
                );
                token::transfer(transfer_ctx, collateral_amount)?;
            }
        }

        // Update market stats
        let options_market = &mut ctx.accounts.options_market;
        options_market.total_options_written = options_market.total_options_written
            .checked_add(amount)
            .ok_or(OptionsError::MathOverflow)?;

        msg!("Option written: {} {} contracts at strike {} expiring at {}", 
             amount, 
             match option_type { OptionType::Call => "CALL", OptionType::Put => "PUT" },
             strike_price,
             expiration_timestamp
        );
        Ok(())
    }

    /// Buy an option contract
    pub fn buy_option(
        ctx: Context<BuyOption>,
        contracts_to_buy: u64,
    ) -> Result<()> {
        require!(contracts_to_buy > 0, OptionsError::InvalidAmount);
        
        let option_contract = &mut ctx.accounts.option_contract;
        let clock = Clock::get()?;
        
        require!(clock.unix_timestamp < option_contract.expiration_timestamp, OptionsError::OptionExpired);
        require!(!option_contract.is_exercised, OptionsError::OptionAlreadyExercised);
        
        let available_contracts = option_contract.amount
            .checked_sub(option_contract.contracts_sold)
            .ok_or(OptionsError::InsufficientContracts)?;
        require!(contracts_to_buy <= available_contracts, OptionsError::InsufficientContracts);

        // Calculate total premium (normalize for decimal scaling)
        let total_premium = option_contract.premium_per_contract
            .checked_mul(contracts_to_buy)
            .ok_or(OptionsError::MathOverflow)?
            .checked_div(1_000_000) // Normalize decimal scaling
            .ok_or(OptionsError::MathOverflow)?;

        // Calculate protocol fee
        let protocol_state = &ctx.accounts.protocol_state;
        let protocol_fee = total_premium
            .checked_mul(protocol_state.protocol_fee_rate)
            .ok_or(OptionsError::MathOverflow)?
            .checked_div(10000)
            .ok_or(OptionsError::MathOverflow)?;

        let net_premium = total_premium
            .checked_sub(protocol_fee)
            .ok_or(OptionsError::MathOverflow)?;

        // Transfer premium from buyer to writer (minus protocol fee)
        let transfer_to_writer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_quote_account.to_account_info(),
                to: ctx.accounts.writer_quote_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        );
        token::transfer(transfer_to_writer_ctx, net_premium)?;

        // Transfer protocol fee to fee collector
        if protocol_fee > 0 {
            let transfer_fee_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_quote_account.to_account_info(),
                    to: ctx.accounts.protocol_fee_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            );
            token::transfer(transfer_fee_ctx, protocol_fee)?;
        }

        // Update option contract first
        option_contract.contracts_sold = option_contract.contracts_sold
            .checked_add(contracts_to_buy)
            .ok_or(OptionsError::MathOverflow)?;

        // Create buyer position
        let buyer_position = &mut ctx.accounts.buyer_position;
        buyer_position.buyer = ctx.accounts.buyer.key();
        buyer_position.option_contract = option_contract.key();
        buyer_position.contracts_owned = contracts_to_buy;
        buyer_position.premium_paid = total_premium;
        buyer_position.is_exercised = false;
        buyer_position.bump = ctx.bumps.buyer_position;

        // Update protocol stats (Note: we need to get protocol_state as mutable)
        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.total_volume = protocol_state.total_volume
            .checked_add(total_premium)
            .ok_or(OptionsError::MathOverflow)?;
        protocol_state.total_fees_collected = protocol_state.total_fees_collected
            .checked_add(protocol_fee)
            .ok_or(OptionsError::MathOverflow)?;

        msg!("Option purchased: {} contracts for {} total premium", contracts_to_buy, total_premium);
        msg!("Protocol stats updated - Volume: {}, Fees: {}", protocol_state.total_volume, protocol_state.total_fees_collected);
        Ok(())
    }

    /// Exercise an option contract
    pub fn exercise_option(ctx: Context<ExerciseOption>) -> Result<()> {
        let buyer_position = &mut ctx.accounts.buyer_position;
        let option_contract = &mut ctx.accounts.option_contract;
        let clock = Clock::get()?;

        require!(!buyer_position.is_exercised, OptionsError::PositionAlreadyExercised);
        require!(clock.unix_timestamp <= option_contract.expiration_timestamp, OptionsError::OptionExpired);
        require!(buyer_position.contracts_owned > 0, OptionsError::NoContractsOwned);

        let contracts_to_exercise = buyer_position.contracts_owned;
        let option_contract_key = option_contract.key();

        match option_contract.option_type {
            OptionType::Call => {
                // For calls: buyer pays strike price, receives underlying tokens
                let payment_amount = option_contract.strike_price
                    .checked_mul(contracts_to_exercise)
                    .ok_or(OptionsError::MathOverflow)?
                    .checked_div(1_000_000) // Normalize decimal scaling
                    .ok_or(OptionsError::MathOverflow)?;

                // Transfer payment from buyer to writer
                let transfer_payment_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_quote_account.to_account_info(),
                        to: ctx.accounts.writer_quote_account.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                );
                token::transfer(transfer_payment_ctx, payment_amount)?;

                // Transfer underlying tokens from collateral vault to buyer
                let seeds = &[
                    b"collateral",
                    option_contract_key.as_ref(),
                    &[ctx.bumps.collateral_vault],
                ];
                let signer = &[&seeds[..]];

                let transfer_underlying_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.collateral_vault.to_account_info(),
                        to: ctx.accounts.buyer_token_account.to_account_info(),
                        authority: ctx.accounts.collateral_vault.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_underlying_ctx, contracts_to_exercise)?;
            }
            OptionType::Put => {
                // For puts: buyer provides underlying tokens, receives quote tokens
                let quote_amount = option_contract.strike_price
                    .checked_mul(contracts_to_exercise)
                    .ok_or(OptionsError::MathOverflow)?
                    .checked_div(1_000_000) // Normalize decimal scaling
                    .ok_or(OptionsError::MathOverflow)?;

                // Transfer underlying tokens from buyer to writer
                let transfer_underlying_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_token_account.to_account_info(),
                        to: ctx.accounts.writer_token_account.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                );
                token::transfer(transfer_underlying_ctx, contracts_to_exercise)?;

                // Transfer quote tokens from collateral vault to buyer
                let seeds = &[
                    b"quote_collateral",
                    option_contract_key.as_ref(),
                    &[ctx.bumps.quote_collateral_vault],
                ];
                let signer = &[&seeds[..]];

                let transfer_quote_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.quote_collateral_vault.to_account_info(),
                        to: ctx.accounts.buyer_quote_account.to_account_info(),
                        authority: ctx.accounts.quote_collateral_vault.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_quote_ctx, quote_amount)?;
            }
        }

        // Calculate and collect settlement fee
        let protocol_state = &ctx.accounts.protocol_state;
        let settlement_value = match option_contract.option_type {
            OptionType::Call => option_contract.strike_price.checked_mul(contracts_to_exercise).ok_or(OptionsError::MathOverflow)?.checked_div(1_000_000).ok_or(OptionsError::MathOverflow)?,
            OptionType::Put => option_contract.strike_price.checked_mul(contracts_to_exercise).ok_or(OptionsError::MathOverflow)?.checked_div(1_000_000).ok_or(OptionsError::MathOverflow)?,
        };

        let settlement_fee = settlement_value
            .checked_mul(protocol_state.settlement_fee_rate)
            .ok_or(OptionsError::MathOverflow)?
            .checked_div(10000)
            .ok_or(OptionsError::MathOverflow)?;

        if settlement_fee > 0 {
            let transfer_fee_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_quote_account.to_account_info(),
                    to: ctx.accounts.protocol_fee_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            );
            token::transfer(transfer_fee_ctx, settlement_fee)?;
        }

        // Mark position as exercised
        buyer_position.is_exercised = true;
        
        // Update option contract
        option_contract.is_exercised = true;

        msg!("Option exercised: {} contracts", contracts_to_exercise);
        Ok(())
    }

    /// Claim expired options (liquidation)
    pub fn claim_expired_option(ctx: Context<ClaimExpiredOption>) -> Result<()> {
        let option_contract = &mut ctx.accounts.option_contract;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp > option_contract.expiration_timestamp, OptionsError::OptionNotExpired);
        require!(!option_contract.is_exercised, OptionsError::OptionAlreadyExercised);
        require!(!option_contract.is_expired, OptionsError::OptionAlreadyClaimed);

        let option_contract_key = option_contract.key();
        
        // Return collateral to writer
        let remaining_contracts = option_contract.amount
            .checked_sub(option_contract.contracts_sold)
            .ok_or(OptionsError::MathOverflow)?;

        match option_contract.option_type {
            OptionType::Call => {
                // Return unsold underlying tokens to writer
                if remaining_contracts > 0 {
                    let seeds = &[
                        b"collateral",
                        option_contract_key.as_ref(),
                        &[ctx.bumps.collateral_vault],
                    ];
                    let signer = &[&seeds[..]];

                    let transfer_ctx = CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.collateral_vault.to_account_info(),
                            to: ctx.accounts.writer_token_account.to_account_info(),
                            authority: ctx.accounts.collateral_vault.to_account_info(),
                        },
                        signer,
                    );
                    token::transfer(transfer_ctx, remaining_contracts)?;
                }
            }
            OptionType::Put => {
                // Return unsold quote token collateral to writer
                if remaining_contracts > 0 {
                    let collateral_amount = option_contract.strike_price
                        .checked_mul(remaining_contracts)
                        .ok_or(OptionsError::MathOverflow)?
                        .checked_div(1_000_000) // Normalize decimal scaling
                        .ok_or(OptionsError::MathOverflow)?;

                    let seeds = &[
                        b"quote_collateral",
                        option_contract_key.as_ref(),
                        &[ctx.bumps.quote_collateral_vault],
                    ];
                    let signer = &[&seeds[..]];

                    let transfer_ctx = CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.quote_collateral_vault.to_account_info(),
                            to: ctx.accounts.writer_quote_account.to_account_info(),
                            authority: ctx.accounts.quote_collateral_vault.to_account_info(),
                        },
                        signer,
                    );
                    token::transfer(transfer_ctx, collateral_amount)?;
                }
            }
        }

        // Mark as expired
        option_contract.is_expired = true;

        msg!("Expired option claimed, collateral returned to writer");
        Ok(())
    }
}

// Data structures
#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub protocol_fee_rate: u64,    // basis points
    pub settlement_fee_rate: u64,  // basis points
    pub liquidation_fee_rate: u64, // basis points
    pub total_volume: u64,
    pub total_fees_collected: u64,
    pub bump: u8,
}

#[account]
pub struct OptionsMarket {
    pub market_id: u64,
    pub underlying_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub authority: Pubkey,
    pub total_options_written: u64,
    pub total_volume: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct OptionContract {
    pub writer: Pubkey,
    pub underlying_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub option_type: OptionType,
    pub strike_price: u64,
    pub expiration_timestamp: i64,
    pub amount: u64,
    pub premium_per_contract: u64,
    pub contracts_sold: u64,
    pub is_exercised: bool,
    pub is_expired: bool,
    pub creation_timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct BuyerPosition {
    pub buyer: Pubkey,
    pub option_contract: Pubkey,
    pub contracts_owned: u64,
    pub premium_paid: u64,
    pub is_exercised: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OptionType {
    Call,
    Put,
}

// Context structs
#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<ProtocolState>(),
        seeds = [b"protocol_state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateOptionsMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<OptionsMarket>(),
        seeds = [b"options_market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub options_market: Account<'info, OptionsMarket>,
    
    pub underlying_mint: Account<'info, Mint>,
    pub quote_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(timestamp_seed: i64)]
pub struct WriteOption<'info> {
    #[account(
        init,
        payer = writer,
        space = 8 + size_of::<OptionContract>(),
        seeds = [
            b"option_contract",
            writer.key().as_ref(),
            underlying_mint.key().as_ref(),
            timestamp_seed.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub option_contract: Account<'info, OptionContract>,
    
    #[account(mut)]
    pub options_market: Account<'info, OptionsMarket>,
    
    pub underlying_mint: Account<'info, Mint>,
    pub quote_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = writer,
        token::mint = underlying_mint,
        token::authority = collateral_vault,
        seeds = [b"collateral", option_contract.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = writer,
        token::mint = quote_mint,
        token::authority = quote_collateral_vault,
        seeds = [b"quote_collateral", option_contract.key().as_ref()],
        bump
    )]
    pub quote_collateral_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_quote_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyOption<'info> {
    #[account(mut)]
    pub option_contract: Account<'info, OptionContract>,
    
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + size_of::<BuyerPosition>(),
        seeds = [
            b"buyer_position",
            buyer.key().as_ref(),
            option_contract.key().as_ref()
        ],
        bump
    )]
    pub buyer_position: Account<'info, BuyerPosition>,
    
    #[account(mut)]
    pub buyer_quote_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_quote_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_fee_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExerciseOption<'info> {
    #[account(mut)]
    pub option_contract: Account<'info, OptionContract>,
    
    #[account(
        mut,
        seeds = [
            b"buyer_position",
            buyer.key().as_ref(),
            option_contract.key().as_ref()
        ],
        bump = buyer_position.bump
    )]
    pub buyer_position: Account<'info, BuyerPosition>,
    
    #[account(
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(
        mut,
        seeds = [b"collateral", option_contract.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"quote_collateral", option_contract.key().as_ref()],
        bump
    )]
    pub quote_collateral_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_quote_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_quote_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_fee_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimExpiredOption<'info> {
    #[account(mut)]
    pub option_contract: Account<'info, OptionContract>,
    
    #[account(
        mut,
        seeds = [b"collateral", option_contract.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"quote_collateral", option_contract.key().as_ref()],
        bump
    )]
    pub quote_collateral_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub writer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = writer_quote_account.owner == writer.key() @ OptionsError::InvalidOwner
    )]
    pub writer_quote_account: Account<'info, TokenAccount>,
    
    #[account(constraint = option_contract.writer == writer.key() @ OptionsError::UnauthorizedWriter)]
    pub writer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// Error codes
#[error_code]
pub enum OptionsError {
    #[msg("Expiration timestamp is in the past")]
    ExpirationInPast,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid premium")]
    InvalidPremium,
    #[msg("Option has expired")]
    OptionExpired,
    #[msg("Option already exercised")]
    OptionAlreadyExercised,
    #[msg("Position already exercised")]
    PositionAlreadyExercised,
    #[msg("Insufficient contracts available")]
    InsufficientContracts,
    #[msg("No contracts owned")]
    NoContractsOwned,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Option not expired yet")]
    OptionNotExpired,
    #[msg("Option already claimed")]
    OptionAlreadyClaimed,
    #[msg("Invalid account owner")]
    InvalidOwner,
    #[msg("Unauthorized writer")]
    UnauthorizedWriter,
}

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_options_dex.json`.
 */
export type SolanaOptionsDex = {
  "address": "E1TXVekuewkrgWspyhUToYeZzucutnEqyVG9eFf8WTKq",
  "metadata": {
    "name": "solanaOptionsDex",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyOption",
      "docs": [
        "Buy an option contract"
      ],
      "discriminator": [
        242,
        253,
        221,
        183,
        67,
        244,
        140,
        119
      ],
      "accounts": [
        {
          "name": "optionContract",
          "writable": true
        },
        {
          "name": "protocolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "buyerPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "buyerQuoteAccount",
          "writable": true
        },
        {
          "name": "writerQuoteAccount",
          "writable": true
        },
        {
          "name": "protocolFeeAccount",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contractsToBuy",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimExpiredOption",
      "docs": [
        "Claim expired options (liquidation)"
      ],
      "discriminator": [
        138,
        45,
        136,
        218,
        130,
        8,
        140,
        129
      ],
      "accounts": [
        {
          "name": "optionContract",
          "writable": true
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "quoteCollateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "writerTokenAccount",
          "writable": true
        },
        {
          "name": "writerQuoteAccount",
          "writable": true
        },
        {
          "name": "writer",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createOptionsMarket",
      "docs": [
        "Create a new options market for a specific underlying token"
      ],
      "discriminator": [
        91,
        147,
        134,
        225,
        99,
        65,
        16,
        44
      ],
      "accounts": [
        {
          "name": "optionsMarket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "underlyingMint"
        },
        {
          "name": "quoteMint"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "exerciseOption",
      "docs": [
        "Exercise an option contract"
      ],
      "discriminator": [
        231,
        98,
        131,
        183,
        245,
        93,
        122,
        48
      ],
      "accounts": [
        {
          "name": "optionContract",
          "writable": true
        },
        {
          "name": "buyerPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "protocolState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "quoteCollateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "buyerQuoteAccount",
          "writable": true
        },
        {
          "name": "writerTokenAccount",
          "writable": true
        },
        {
          "name": "writerQuoteAccount",
          "writable": true
        },
        {
          "name": "protocolFeeAccount",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initializeProtocol",
      "docs": [
        "Initialize the global protocol state"
      ],
      "discriminator": [
        188,
        233,
        252,
        106,
        134,
        146,
        202,
        91
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "protocolFeeRate",
          "type": "u64"
        },
        {
          "name": "settlementFeeRate",
          "type": "u64"
        },
        {
          "name": "liquidationFeeRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "writeOption",
      "docs": [
        "Write (sell) a new option contract"
      ],
      "discriminator": [
        96,
        144,
        104,
        51,
        39,
        132,
        235,
        38
      ],
      "accounts": [
        {
          "name": "optionContract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "writer"
              },
              {
                "kind": "account",
                "path": "underlyingMint"
              },
              {
                "kind": "arg",
                "path": "timestampSeed"
              }
            ]
          }
        },
        {
          "name": "optionsMarket",
          "writable": true
        },
        {
          "name": "underlyingMint"
        },
        {
          "name": "quoteMint"
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "quoteCollateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "optionContract"
              }
            ]
          }
        },
        {
          "name": "writerTokenAccount",
          "writable": true
        },
        {
          "name": "writerQuoteAccount",
          "writable": true
        },
        {
          "name": "writer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "timestampSeed",
          "type": "i64"
        },
        {
          "name": "optionType",
          "type": {
            "defined": {
              "name": "optionType"
            }
          }
        },
        {
          "name": "strikePrice",
          "type": "u64"
        },
        {
          "name": "expirationTimestamp",
          "type": "i64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "premiumPerContract",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "buyerPosition",
      "discriminator": [
        232,
        163,
        167,
        95,
        170,
        210,
        214,
        83
      ]
    },
    {
      "name": "optionContract",
      "discriminator": [
        196,
        220,
        72,
        61,
        245,
        42,
        68,
        234
      ]
    },
    {
      "name": "optionsMarket",
      "discriminator": [
        67,
        30,
        90,
        36,
        130,
        219,
        166,
        8
      ]
    },
    {
      "name": "protocolState",
      "discriminator": [
        33,
        51,
        173,
        134,
        35,
        140,
        195,
        248
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "expirationInPast",
      "msg": "Expiration timestamp is in the past"
    },
    {
      "code": 6001,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6002,
      "name": "invalidPremium",
      "msg": "Invalid premium"
    },
    {
      "code": 6003,
      "name": "optionExpired",
      "msg": "Option has expired"
    },
    {
      "code": 6004,
      "name": "optionAlreadyExercised",
      "msg": "Option already exercised"
    },
    {
      "code": 6005,
      "name": "positionAlreadyExercised",
      "msg": "Position already exercised"
    },
    {
      "code": 6006,
      "name": "insufficientContracts",
      "msg": "Insufficient contracts available"
    },
    {
      "code": 6007,
      "name": "noContractsOwned",
      "msg": "No contracts owned"
    },
    {
      "code": 6008,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6009,
      "name": "optionNotExpired",
      "msg": "Option not expired yet"
    },
    {
      "code": 6010,
      "name": "optionAlreadyClaimed",
      "msg": "Option already claimed"
    },
    {
      "code": 6011,
      "name": "invalidOwner",
      "msg": "Invalid account owner"
    },
    {
      "code": 6012,
      "name": "unauthorizedWriter",
      "msg": "Unauthorized writer"
    }
  ],
  "types": [
    {
      "name": "buyerPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "optionContract",
            "type": "pubkey"
          },
          {
            "name": "contractsOwned",
            "type": "u64"
          },
          {
            "name": "premiumPaid",
            "type": "u64"
          },
          {
            "name": "isExercised",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "optionContract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "writer",
            "type": "pubkey"
          },
          {
            "name": "underlyingMint",
            "type": "pubkey"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "optionType",
            "type": {
              "defined": {
                "name": "optionType"
              }
            }
          },
          {
            "name": "strikePrice",
            "type": "u64"
          },
          {
            "name": "expirationTimestamp",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "premiumPerContract",
            "type": "u64"
          },
          {
            "name": "contractsSold",
            "type": "u64"
          },
          {
            "name": "isExercised",
            "type": "bool"
          },
          {
            "name": "isExpired",
            "type": "bool"
          },
          {
            "name": "creationTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "optionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "call"
          },
          {
            "name": "put"
          }
        ]
      }
    },
    {
      "name": "optionsMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": "u64"
          },
          {
            "name": "underlyingMint",
            "type": "pubkey"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalOptionsWritten",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "protocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "protocolFeeRate",
            "type": "u64"
          },
          {
            "name": "settlementFeeRate",
            "type": "u64"
          },
          {
            "name": "liquidationFeeRate",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalFeesCollected",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

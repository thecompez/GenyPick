import type { Address } from "viem";

export const GENY_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_GENY_TOKEN_ADDRESS || "0x2a3d6f8c1fc4AcDcf3A75d19b445bae02F03676B") as Address;

export const ADMIN_WALLET =
  (process.env.NEXT_PUBLIC_ADMIN_WALLET ||
   process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
   "0x6E99f7564d060AA141dcC47ede34379Bad0cDCCC") as Address;

export const BASE_CHAIN_ID = 8453;
export const CARD_PRICE_GENY = 256;
export const MAX_ATTEMPTS = 32;
export const GENY_DECIMALS = 18;

export const genyTokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const genyPickAbi = [
  {
    type: "function",
    name: "CARD_PRICE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "MAX_ATTEMPTS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    type: "function",
    name: "deadline",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "totalPool",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "rewardPool",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "treasuryPool",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "finalized",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "submissionsLocked",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "merkleRoot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "hasSubmitted",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "attemptCount",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    type: "function",
    name: "totalPaidByUser",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getPrediction",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "champion", type: "uint16" },
          { name: "runnerUp", type: "uint16" },
          { name: "thirdPlace", type: "uint16" },
          { name: "fourthPlace", type: "uint16" },
          { name: "entryAmount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "attemptNumber", type: "uint8" },
          { name: "active", type: "bool" },
          { name: "invalidatedAt", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getActivePrediction",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "champion", type: "uint16" },
          { name: "runnerUp", type: "uint16" },
          { name: "thirdPlace", type: "uint16" },
          { name: "fourthPlace", type: "uint16" },
          { name: "entryAmount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "attemptNumber", type: "uint8" },
          { name: "active", type: "bool" },
          { name: "invalidatedAt", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getPredictionHistoryLength",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "calculateScore",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint16" }]
  },
  {
    type: "function",
    name: "submitOrRevisePrediction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "champion", type: "uint16" },
      { name: "runnerUp", type: "uint16" },
      { name: "thirdPlace", type: "uint16" },
      { name: "fourthPlace", type: "uint16" },
      { name: "entryAmount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "submitPrediction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "champion", type: "uint16" },
      { name: "runnerUp", type: "uint16" },
      { name: "thirdPlace", type: "uint16" },
      { name: "fourthPlace", type: "uint16" },
      { name: "entryAmount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "lockSubmissions",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "setDeadline",
    stateMutability: "nonpayable",
    inputs: [{ name: "newDeadline", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "setFinalResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "champion", type: "uint16" },
      { name: "runnerUp", type: "uint16" },
      { name: "thirdPlace", type: "uint16" },
      { name: "fourthPlace", type: "uint16" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "finalizePool",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "setMerkleRoot",
    stateMutability: "nonpayable",
    inputs: [{ name: "root", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "withdrawTreasury",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "claimReward",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "proof", type: "bytes32[]" }
    ],
    outputs: []
  }
] as const;

export function getGenyPickAddress(): Address | undefined {
  const value = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS;
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return "0xB51fDed7E834F187D54a54843926Ab51e2bb2F60" as Address;
  }
  return value as Address;
}

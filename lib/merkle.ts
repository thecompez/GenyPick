import { concat, encodePacked, getAddress, keccak256, type Address, type Hex } from "viem";

export type RewardLeaf = {
  account: Address;
  amount: bigint;
};

export function hashRewardLeaf(leaf: RewardLeaf): Hex {
  return keccak256(encodePacked(["address", "uint256"], [getAddress(leaf.account), leaf.amount]));
}

function sortPair(a: Hex, b: Hex): [Hex, Hex] {
  return BigInt(a) < BigInt(b) ? [a, b] : [b, a];
}

function hashPair(a: Hex, b: Hex): Hex {
  const [left, right] = sortPair(a, b);
  return keccak256(concat([left, right]));
}

export function buildMerkleTree(leaves: RewardLeaf[]) {
  const hashedLeaves = leaves.map(hashRewardLeaf);
  const layers: Hex[][] = [hashedLeaves];
  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1];
    const next: Hex[] = [];
    for (let index = 0; index < current.length; index += 2) {
      const left = current[index];
      const right = current[index + 1] ?? current[index];
      next.push(hashPair(left, right));
    }
    layers.push(next);
  }

  return {
    root: layers.at(-1)?.[0] ?? ("0x0000000000000000000000000000000000000000000000000000000000000000" as Hex),
    layers,
    getProof(leaf: RewardLeaf): Hex[] {
      let index = hashedLeaves.findIndex((candidate) => candidate === hashRewardLeaf(leaf));
      if (index === -1) return [];
      const proof: Hex[] = [];
      for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
        const layer = layers[layerIndex];
        const pairIndex = index % 2 === 0 ? index + 1 : index - 1;
        proof.push(layer[pairIndex] ?? layer[index]);
        index = Math.floor(index / 2);
      }
      return proof;
    }
  };
}

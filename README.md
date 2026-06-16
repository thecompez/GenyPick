# GenyPick

GenyPick is a production-ready Farcaster Mini App for World Cup 2026 Top 4 predictions powered by GENY on Base.

Users enter the pool by paying GENY, choose the final Top 4 teams in exact order, and appear on a leaderboard. Before submissions are locked, users can revise their card by making another paid attempt. Only the latest active card counts for scoring and rewards; previous cards remain in history, are invalidated, and are not refunded or token-burned.

Each card costs exactly 256 GENY, with a maximum of 32 attempts per wallet. All paid cards increase `totalPool`. After official results are set, 75% of the collected GENY pool is reserved for exact Top 4 winners, split equally. The remaining 25% goes to treasury/ecosystem.

## Stack

- Next.js 15, React, TypeScript, Tailwind CSS
- Farcaster Mini App SDK and Mini App manifest
- Wagmi and Viem on Base mainnet
- Solidity, OpenZeppelin, Foundry
- PostgreSQL or Supabase for leaderboard indexing
- Vercel-ready API routes and image routes

## Farcaster Mini App Features

- `@farcaster/miniapp-sdk` runtime initialization
- `sdk.actions.ready()` after Mini App UI context is loaded
- Mini App context detection with normal browser fallback
- Farcaster user profile display when available
- Native Mini App wallet connector through Wagmi
- Cast/share flow with `sdk.actions.composeCast`
- Add-to-app flow with `sdk.actions.addMiniApp`
- Manifest at `/.well-known/farcaster.json`
- Farcaster account association fields from environment variables
- Discovery metadata and generated OG/splash images

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

For local UI development without `DATABASE_URL`, the leaderboard route returns demo rows. Production deployments must configure PostgreSQL/Supabase and run `db/schema.sql`; demo data is only allowed in production when `ENABLE_DEMO_DATA=true` is set intentionally.

## Environment

Set these before production deployment:

```bash
NEXT_PUBLIC_ORIGIN=https://genypick.miniapps.genyleap.com
NEXT_PUBLIC_APP_PATH=
NEXT_PUBLIC_APP_URL=https://genypick.miniapps.genyleap.com
NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://...
DATABASE_URL=postgres://...
ADMIN_SECRET=use-a-long-random-secret
FARCASTER_ACCOUNT_ASSOCIATION_HEADER=...
FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD=...
FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE=...
```

`NEXT_PUBLIC_SUBMISSION_DEADLINE` can be a Unix timestamp in seconds or an ISO date string. The contract deadline is authoritative, and `lockSubmissions()` is the manual owner-controlled lock. Either lock condition blocks submissions and revisions.

The Next.js app is built at `/` internally. For the production URL `https://genypick.miniapps.genyleap.com`, keep Next.js on `127.0.0.1:3000` and let Nginx serve the public HTTPS site on port 443 while proxying app traffic to the internal Next.js process.

## Database

Run:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

The app indexes confirmed on-chain attempts through `POST /api/index/prediction`. For production, pair this route with an event indexer that verifies `PredictionSubmitted` logs from the deployed contract before inserting rows. The database stores full attempt history in `prediction_attempts`; only one active attempt per wallet is allowed, and leaderboard/scoring routes use only active attempts.

## Smart Contract

Contract: `contracts/GenyPick2026.sol`

GENY token on Base:

```text
0x2a3d6f8c1fc4AcDcf3A75d19b445bae02F03676B
```

Deploy with Foundry:

```bash
forge install foundry-rs/forge-std
npm install
TREASURY=0xYourTreasury \
SUBMISSION_DEADLINE=1798761600 \
PRIVATE_KEY=0x... \
forge script script/DeployGenyPick2026.s.sol:DeployGenyPick2026 \
  --rpc-url "$NEXT_PUBLIC_BASE_RPC_URL" \
  --broadcast \
  --verify
```

After deployment, set `NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS`.

## Reward Settlement

The contract stores entries and `totalPool`. Admin sets the official final result manually and finalizes the pool. The backend computes analytics scores and exact-match rewards from active latest attempts, then generates a Merkle tree using:

```text
keccak256(abi.encodePacked(user, amount))
```

Owner calls `setMerkleRoot(root)`. Exact Top 4 winners claim with `claimReward(amount, proof)`. If there are no exact winners, no claimable rewards are generated. The current admin tooling can generate the root and proofs and set the root on-chain; proof persistence/export and a self-serve user claim UI must be completed operationally before public claiming is opened.

## Reward Rule

Only active cards that exactly match champion, runner-up, third place, and fourth place receive rewards. Partial scores remain analytics only.

```text
rewardPool = totalPool * 75 / 100
rewardPerWinner = rewardPool / perfectWinnerCount
```

There is no variable entry amount and no reward weighting based on payment size.

## Tests

Frontend and shared TypeScript tests:

```bash
npm test
```

Type checking:

```bash
npm run typecheck
```

Foundry tests:

```bash
forge install foundry-rs/forge-std
forge test -vvv
```

## Compliance Copy

GenyPick is a community prediction game powered by GENY. Participation does not guarantee profit. Rewards are distributed from the community pool according to the published rules, eligibility, availability, and applicable local regulations.

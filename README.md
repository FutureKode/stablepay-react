# @futurekode/stablepay-react

Headless React components and helpers for accepting stable tokens on Solana with built-in verification. USDC remains the default.

This package is the reusable payment component layer. It does not depend on the hosted Payflow dashboard or request-page product.

## Install

```bash
npm install @futurekode/stablepay-react
```

## Usage

### Simple checkout

```tsx
import {
  StablePayProvider,
  StablePayButton,
  usePaymentVerification,
} from "@futurekode/stablepay-react";

export function Checkout() {
  const { status, verify } = usePaymentVerification();

  return (
    <StablePayProvider to="YOUR_WALLET_ADDRESS">
      <StablePayButton
        amount={0.1}
        reference="order-123"
        metadata={{ requestId: "req_123", customerEmail: "alice@example.com" }}
        onSuccess={async (payload) => {
          console.log(payload.metadata?.requestId);
          await verify(payload);
        }}
      >
        <button>
          {status === "verifying"
            ? "Verifying..."
            : status === "pending"
              ? "Confirming..."
              : status === "confirmed"
                ? "Paid"
                : "Pay 0.1 USDC"}
        </button>
      </StablePayButton>
    </StablePayProvider>
  );
}
```

`StablePayButton` is the clearer alias for the payment button component. `StablePay` is still exported for compatibility.

### Token presets

```tsx
import { TOKENS, getTokenConfig } from "@futurekode/stablepay-react";

const usdc = TOKENS.USDC;
const usdt = getTokenConfig("USDT");
```

### Preflight checks

Use `usePaymentPreflight` to check wallet readiness before asking the user to sign.

```tsx
import {
  TOKENS,
  StablePayButton,
  StablePayProvider,
  usePaymentPreflight,
} from "@futurekode/stablepay-react";

export function Checkout() {
  const { check, loading, result } = usePaymentPreflight({
    amount: 24,
    to: "YOUR_WALLET_ADDRESS",
    token: TOKENS.USDC,
  });

  return (
    <StablePayProvider to="YOUR_WALLET_ADDRESS">
      <button onClick={() => void check()}>
        {loading ? "Checking..." : "Check wallet readiness"}
      </button>

      {result && <p>{result.message}</p>}

      <StablePayButton amount={24} reference="invoice-1842" token={TOKENS.USDC}>
        <button disabled={!result?.ok}>Pay 24.00 USDC</button>
      </StablePayButton>
    </StablePayProvider>
  );
}
```

`runPaymentPreflight` is also exported for non-hook usage.

### Recipient token account creation

Set `createRecipientTokenAccount` if you want the payment transaction to create the recipient associated token account when it does not exist yet.

```tsx
import { StablePayButton, TOKENS } from "@futurekode/stablepay-react";

<StablePayButton
  amount={24}
  reference="invoice-1842"
  token={TOKENS.USDC}
  createRecipientTokenAccount
>
  <button>Pay 24.00 USDC</button>
</StablePayButton>;
```

### Error normalization

```tsx
import { normalizeStablePayError, TOKENS } from "@futurekode/stablepay-react";

try {
  // payment flow
} catch (error) {
  const normalized = normalizeStablePayError(error, TOKENS.USDC);
  console.log(normalized.code, normalized.message);
}
```

### Payment status and events

`useStablePay` exposes `status`, `reset()`, and lifecycle events for checkout-style flows.

```tsx
import { TOKENS, useStablePay } from "@futurekode/stablepay-react";

export function CheckoutButton() {
  const { pay, status, error, reset } = useStablePay();

  return (
    <>
      <button
        onClick={() =>
          void pay({
            amount: 24,
            to: "YOUR_WALLET_ADDRESS",
            reference: "invoice-1842",
            token: TOKENS.USDC,
          })
        }
      >
        {status === "awaiting_wallet"
          ? "Connect wallet..."
          : status === "preparing"
            ? "Preparing..."
            : status === "submitting"
              ? "Opening wallet..."
              : status === "confirming"
                ? "Confirming..."
                : status === "confirmed"
                  ? "Paid"
                  : "Pay 24.00 USDC"}
      </button>

      {error ? <p>{error.message}</p> : null}
      {status === "failed" ? <button onClick={reset}>Try again</button> : null}
    </>
  );
}
```

## API

- `StablePayButton` — clearer alias for the payment button component
- `useStablePay` — hook with payment status, reset, and lifecycle events
- `usePaymentVerification` — verify a submitted payment
- `usePaymentPreflight` — wallet and payment readiness checks
- `runPaymentPreflight` — non-hook preflight helper
- `verifyPayment` — verify a transaction against expected payment details
- `waitForPaymentConfirmation` — wait until a payment is confirmed
- `normalizeStablePayError` — map raw errors into developer-friendly messages
- `StableTokenConfig` — token model for mint/decimals-aware integrations

### `token`

`StablePayButton` accepts an optional `token` prop. If omitted, the package uses `USDC_TOKEN_CONFIG`.

```tsx
import { StablePayButton, TOKENS } from "@futurekode/stablepay-react";

<StablePayButton amount={0.1} reference="order-123" token={TOKENS.USDC}>
  <button>Pay 0.1 USDC</button>
</StablePayButton>;
```

`StablePay` is still exported as a compatibility name for the same component. USDC compatibility helpers such as `buildUsdcTransfer`, `parseUsdcPaymentFromTransaction`, and `getUsdcTokenAccountForWallet` are also still exported, and USDC remains the default token when no `token` is provided.

### `metadata`

`StablePayButton` accepts an optional `metadata` prop for app-side context.

```tsx
<StablePayButton
  amount={0.1}
  reference="order-123"
  metadata={{ requestId: "req_123", customerEmail: "alice@example.com" }}
  onSuccess={(payload) => {
    console.log(payload.metadata?.requestId);
  }}
>
  <button>Pay 0.1 USDC</button>
</StablePayButton>
```

`metadata` is:

- returned in the `onSuccess` payload
- useful for request IDs, customer context, or analytics source data
- not sent on-chain
- not persisted anywhere by the package itself

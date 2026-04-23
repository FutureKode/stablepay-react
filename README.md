# @futurekode/stablepay-react

Headless React components and helpers for accepting stable tokens on Solana with built-in verification. USDC remains the default.

This package is the reusable payment component layer. It does not depend on the hosted Payflow dashboard or request-page product.

## Install

```bash
npm install @futurekode/stablepay-react
```

## Usage

```tsx
import {
  StablePayProvider,
  StablePay,
  usePaymentVerification,
} from "@futurekode/stablepay-react";

export function Checkout() {
  const { status, verify } = usePaymentVerification();

  return (
    <StablePayProvider to="YOUR_WALLET_ADDRESS">
      <StablePay
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
      </StablePay>
    </StablePayProvider>
  );
}
```

## API

- verifyPayment — verify a transaction against expected payment details
- waitForPaymentConfirmation — wait until a payment is confirmed
- usePaymentVerification — React hook for simplest integration
- `StableTokenConfig` — token model for mint/decimals-aware integrations

### `token`

`StablePay` now accepts an optional `token` prop. If omitted, the package uses `USDC_TOKEN_CONFIG`.

```tsx
import { StablePay, USDC_TOKEN_CONFIG } from "@futurekode/stablepay-react";

<StablePay amount={0.1} reference="order-123" token={USDC_TOKEN_CONFIG}>
  <button>Pay 0.1 USDC</button>
</StablePay>;
```

USDC compatibility helpers such as `buildUsdcTransfer`, `parseUsdcPaymentFromTransaction`, and `getUsdcTokenAccountForWallet` are still exported.

### `metadata`

`StablePay` accepts an optional `metadata` prop for app-side context.

```tsx
<StablePay
  amount={0.1}
  reference="order-123"
  metadata={{ requestId: "req_123", customerEmail: "alice@example.com" }}
  onSuccess={(payload) => {
    console.log(payload.metadata?.requestId);
  }}
>
  <button>Pay 0.1 USDC</button>
</StablePay>
```

`metadata` is:

- returned in the `onSuccess` payload
- useful for request IDs, customer context, or analytics source data
- not sent on-chain
- not persisted anywhere by the package itself

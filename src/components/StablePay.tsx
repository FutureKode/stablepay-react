import React from "react";
import { useStablePay } from "../hooks/useStablePay";
import { useStablePayContext } from "../context/StablePayContext";
import type { StablePayProps } from "../types";

type ClickableChildProps = {
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
};

function getResolvedTo(to?: string, defaultTo?: string): string {
  const resolved = to ?? defaultTo;

  if (!resolved) {
    throw new Error(
      "StablePay: missing recipient address. Provide `to` on StablePay or StablePayProvider.",
    );
  }

  return resolved;
}

export function StablePay<TMetadata = undefined>({
  amount,
  to,
  reference,
  metadata,
  children,
  onSuccess,
  onError,
}: StablePayProps<TMetadata>) {
  const { pay, loading } = useStablePay<TMetadata>();
  const { defaultTo } = useStablePayContext();

  const resolvedTo = getResolvedTo(to, defaultTo);

  if (!resolvedTo) {
    throw new Error(
      "StablePay: missing recipient address. Provide `to` on StablePay or StablePayProvider.",
    );
  }

  if (!React.isValidElement<ClickableChildProps>(children)) {
    throw new Error("StablePay expects a single React element child.");
  }

  async function handleClick(event: React.MouseEvent) {
    try {
      children.props.onClick?.(event);

      if (event.defaultPrevented) return;

      await pay({
        amount,
        to: resolvedTo,
        reference,
        metadata,
        onSuccess,
        onError,
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Payment failed"));
    }
  }

  return React.cloneElement(children, {
    onClick: handleClick,
    disabled: Boolean(children.props.disabled) || loading,
  });
}

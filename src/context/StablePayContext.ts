import { createContext, useContext } from "react";

type StablePayContextValue = {
  defaultTo?: string;
};

const StablePayContext = createContext<StablePayContextValue>({});

export function useStablePayContext() {
  return useContext(StablePayContext);
}

export default StablePayContext;

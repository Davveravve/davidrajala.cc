"use client";

import { createContext, useContext } from "react";

type AdminCtx = {
  has2fa: boolean;
};

const Ctx = createContext<AdminCtx>({ has2fa: false });

export function AdminContextProvider({
  has2fa,
  children,
}: {
  has2fa: boolean;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ has2fa }}>{children}</Ctx.Provider>;
}

export function useAdminContext() {
  return useContext(Ctx);
}

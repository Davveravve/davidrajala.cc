"use client";

import { createContext, useContext, useState } from "react";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const ChatContext = createContext<Ctx | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ChatContext.Provider
      value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}

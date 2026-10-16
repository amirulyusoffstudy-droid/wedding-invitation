import { createContext, useContext } from "react";

export interface Wish {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt: string;
}

export interface GuestbookState {
  apiUrl: string;
  wishes: Wish[];
  status: "loading" | "ready" | "error";
  reload: () => void;
  addWish: (wish: Wish) => void;
}

export const GuestbookContext = createContext<GuestbookState | null>(null);

export function useGuestbook() {
  const guestbook = useContext(GuestbookContext);
  if (!guestbook) throw new Error("GuestbookProvider is required");
  return guestbook;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  activeBranchId: string | null;
  activeBranchName: string | null;
  setActiveBranch: (id: string, name: string) => void;
  clearActiveBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      activeBranchName: null,
      setActiveBranch: (id, name) =>
        set({ activeBranchId: id, activeBranchName: name }),
      clearActiveBranch: () =>
        set({ activeBranchId: null, activeBranchName: null }),
    }),
    {
      name: "pos-branch-store",
    }
  )
);

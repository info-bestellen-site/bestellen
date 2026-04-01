'use client'

import { create } from 'zustand'

interface AdminStore {
  editMode: boolean
  toggleEditMode: () => void
  setEditMode: (val: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  editMode: false,
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
  setEditMode: (editMode) => set({ editMode }),
}))

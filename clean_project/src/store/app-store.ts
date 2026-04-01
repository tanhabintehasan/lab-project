import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  notificationCount: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setNotificationCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  searchOpen: false,
  notificationCount: 0,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setNotificationCount: (count) => set({ notificationCount: count }),
}));

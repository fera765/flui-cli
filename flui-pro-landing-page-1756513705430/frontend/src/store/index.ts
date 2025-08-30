import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Cart state
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  
  // Form state
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  
  // Notifications
  notifications: Array<{ id: string; type: string; message: string }>;
  addNotification: (notification: { type: string; message: string }) => void;
  removeNotification: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      
      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Cart state
      selectedPlan: null,
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      
      // Form state
      formData: {},
      setFormData: (data) => set({ formData: data }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: Date.now().toString() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedPlan: state.selectedPlan,
      }),
    }
  )
);
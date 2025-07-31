import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DashboardView = 'preferences' | 'accounts' | 'explore';

/**
 * Dashboard Store
 *
 * Manages the active view state for the dashboard with persistent storage.
 * The selected view (preferences, accounts, or explore) is automatically
 * saved to localStorage and restored on page reload.
 */
interface DashboardState {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    resetView: () => void;
    getCurrentView: () => DashboardView;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            activeView: 'explore',
            setActiveView: (view) => set({ activeView: view }),
            resetView: () => set({ activeView: 'explore' }),
            getCurrentView: () => get().activeView,
        }),
        {
            name: 'dashboard-view',
        },
    ),
);

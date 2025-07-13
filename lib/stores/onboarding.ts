import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    resetStep: () => void;
    clearStorage: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            currentStep: 1,
            setCurrentStep: (step) => set({ currentStep: step }),
            resetStep: () => set({ currentStep: 1 }),
            clearStorage: () => {
                // Clear the persisted storage
                localStorage.removeItem('onboarding-step');
                // Reset state to initial values
                set({ currentStep: 1 });
            },
        }),
        {
            name: 'onboarding-step',
        },
    ),
);

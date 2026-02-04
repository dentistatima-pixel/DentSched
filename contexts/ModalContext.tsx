import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ModalType = string;

interface ModalState {
    type: ModalType;
    props: any;
}

interface ModalContextType {
    openModal: (type: ModalType, props?: any) => void;
    closeModal: () => void;
    closeAllModals: () => void;
    modalStack: ModalState[];
}

// FIX: Export ModalContext to make it available for import in other modules.
export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalStack, setModalStack] = useState<ModalState[]>([]);

    const openModal = useCallback((type: ModalType, props: any = {}) => {
        setModalStack(stack => [...stack, { type, props }]);
    }, []);

    const closeModal = useCallback(() => {
        setModalStack(stack => stack.slice(0, stack.length - 1));
    }, []);

    const closeAllModals = useCallback(() => {
        setModalStack([]);
    }, []);

    const value = { openModal, closeModal, closeAllModals, modalStack };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    // FIX: Adapt the hook to the new multi-modal stack architecture.
    // The `showModal` function is now named `openModal`.
    // The `hideModal` function is now named `closeModal`.
    // `modalState` is now `modalStack` and the active modal is the last one.
    const activeModal = context.modalStack[context.modalStack.length - 1];
    return { 
        openModal: context.openModal, 
        closeModal: context.closeModal,
        closeAllModals: context.closeAllModals,
        modalState: { // Maintain compatibility with old `modalState` structure for ModalManager
            type: activeModal?.type || null,
            props: activeModal?.props || {}
        }
    };
};
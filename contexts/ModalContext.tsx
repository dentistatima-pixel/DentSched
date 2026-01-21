import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = string;

interface ModalState {
    type: ModalType | null;
    props: any;
}

interface ModalContextType {
    showModal: (type: ModalType, props?: any) => void;
    hideModal: () => void;
    modalState: ModalState;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ModalState>({ type: null, props: {} });

    const showModal = (type: ModalType, props: any = {}) => {
        setModalState({ type, props });
    };

    const hideModal = () => {
        setModalState({ type: null, props: {} });
    };

    const value = { showModal, hideModal, modalState };

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
    return context;
};

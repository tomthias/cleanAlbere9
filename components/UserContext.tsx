import React, { createContext, useContext, useState, useEffect } from 'react';
import { Person } from '../types';

interface UserContextType {
    currentUser: Person | null;
    setCurrentUser: (user: Person | null) => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Person | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('flatmate_current_user');
        if (savedUser) {
            setCurrentUser(savedUser as Person);
        }
        setIsLoading(false);
    }, []);

    const handleSetUser = (user: Person | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem('flatmate_current_user', user);
        } else {
            localStorage.removeItem('flatmate_current_user');
        }
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

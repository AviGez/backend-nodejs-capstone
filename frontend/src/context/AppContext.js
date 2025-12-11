import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();
// פונקציה לאתחול מצב המשתמש מה‑sessionStorage
const getInitialSession = () => {
  if (typeof window === 'undefined') {
    return { token: null, name: '', role: 'user', userId: '' };
  }
  const token = sessionStorage.getItem('auth-token');
  const name = sessionStorage.getItem('name') || '';
  const role = sessionStorage.getItem('role') || 'user';
  const userId = sessionStorage.getItem('user-id') || '';
  return { token, name, role, userId };
};
// ספק הקשר (Context Provider) לאפליקציה
export const AppProvider = ({ children }) => {
  const { token, name, role, userId } = getInitialSession();
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [userName, setUserName] = useState(name);
  const [userRole, setUserRole] = useState(role);
  const [currentUserId, setCurrentUserId] = useState(userId);

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      setIsLoggedIn,
      userName,
      setUserName,
      userRole,
      setUserRole,
      currentUserId,
      setCurrentUserId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

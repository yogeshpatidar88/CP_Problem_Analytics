// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import Login from './Login';
import Register from './Register';
import UserProfileDisplay from './components/UserProfileDisplay';
import ProblemData from './components/ProblemData';
import UserComparison from './components/UserComparison';
import CodeEditor from './components/CodeEditor';

function App() {
  const [handle, setHandle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // Update user activity timestamp
  const updateActivity = () => {
    if (isAuthenticated) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  };

  // Track user activity
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    if (isAuthenticated) {
      // Add event listeners for user activity
      window.addEventListener('click', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('mousemove', handleActivity);
      
      return () => {
        // Cleanup event listeners
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        window.removeEventListener('mousemove', handleActivity);
      };
    }
  }, [isAuthenticated]);

  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const savedHandle = localStorage.getItem('userHandle');
    const savedAuthState = localStorage.getItem('isAuthenticated');
    const savedCurrentPage = localStorage.getItem('currentPage');
    const lastActivity = localStorage.getItem('lastActivity');
    
    // Check if session is still valid (24 hours)
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    
    if (savedHandle && savedAuthState === 'true') {
      if (lastActivity && (now - parseInt(lastActivity)) > sessionTimeout) {
        // Session expired, clear everything
        localStorage.removeItem('userHandle');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastActivity');
        localStorage.setItem('currentPage', 'home');
      } else {
        // Session still valid
        setHandle(savedHandle);
        setIsAuthenticated(true);
        // Update last activity
        localStorage.setItem('lastActivity', now.toString());
        
        // Only set saved page if user is authenticated, otherwise stay on home
        if (savedCurrentPage && savedCurrentPage !== 'login' && savedCurrentPage !== 'register') {
          setCurrentPage(savedCurrentPage);
        }
      }
    }
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    // Save current page to localStorage (except for login/register pages)
    if (page !== 'login' && page !== 'register') {
      localStorage.setItem('currentPage', page);
    }
  };

  const handleLogin = (username) => {
    setHandle(username);
    setIsAuthenticated(true);
    setCurrentPage('profile');
    
    // Save authentication state to localStorage
    const now = Date.now();
    localStorage.setItem('userHandle', username);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentPage', 'profile');
    localStorage.setItem('lastActivity', now.toString());
  };

  const handleRegister = (username) => {
    // Same as login for simplicity
    handleLogin(username);
  };

  const handleLogout = () => {
    setHandle('');
    setIsAuthenticated(false);
    setCurrentPage('home');
    
    // Clear authentication state from localStorage
    localStorage.removeItem('userHandle');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastActivity');
    localStorage.setItem('currentPage', 'home');
  };

  return (
    <div className="App">
      {currentPage === 'home' && (
        <HomePage
          onLoginClick={() => navigateTo('login')}
          onRegisterClick={() => navigateTo('register')}
          onUserAnalyticsClick={() => navigateTo(isAuthenticated ? 'profile' : 'login')}
          onProblemAnalysisClick={() => navigateTo('problemData')}
          onUserComparisonClick={() => navigateTo('userComparison')}
          onCodeEditorClick={() => navigateTo('codeEditor')}
        />
      )}

      {currentPage === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitch={() => navigateTo('register')}
          onBackToHome={() => navigateTo('home')}
        />
      )}

      {currentPage === 'register' && (
        <Register
          onRegister={handleRegister}
          onSwitch={() => navigateTo('login')}
          onBackToHome={() => navigateTo('home')}
        />
      )}

      {currentPage === 'profile' && isAuthenticated && (
        <UserProfileDisplay
          handle={handle}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'problemData' && (
        <ProblemData
          handle={handle}
          onBackToHome={() => navigateTo('home')}
        />
      )}

      {currentPage === 'userComparison' && (
        <UserComparison onBackToHome={() => navigateTo('home')} />
      )}

      {currentPage === 'codeEditor' && (
        <CodeEditor onBackToHome={() => navigateTo('home')} />
      )}
    </div>
  );
}

export default App;

// src/App.js
import React, { useState } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import Login from './Login';
import Register from './Register';
import UserProfileDisplay from './components/UserProfileDisplay';
import ProblemData from './components/ProblemData';
import UserComparison from './components/UserComparison';

function App() {
  const [handle, setHandle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = (username) => {
    setHandle(username);
    setIsAuthenticated(true);
    setCurrentPage('profile');
  };

  const handleLogout = () => {
    setHandle('');
    setIsAuthenticated(false);
    setCurrentPage('home');
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
          onRegister={handleLogin}
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
    </div>
  );
}

export default App;

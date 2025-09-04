import React, { useEffect, useState } from 'react';
import './HomePage.css';

function HomePage({ onLoginClick, onUserAnalyticsClick, onRegisterClick, onProblemAnalysisClick, onUserComparisonClick }) {
  const [showIntro, setShowIntro] = useState(true);

  // Create stars on component mount
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);

    // Function to create stars
    function createStars() {
      const container = document.querySelector('.stars-container');
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random positioning
        star.style.top = `${Math.random() * 100}vh`;
        star.style.left = `${Math.random() * 100}vw`;
        
        // Random size
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        container.appendChild(star);
      }
    }

    createStars();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="homepage-container">
      <div className="stars-container"></div>
      {showIntro && (
        <div className="intro">
          <h1 className="intro-text">Codeforces Analytics</h1>
        </div>
      )}
      {!showIntro && (
        <>
          {/* Background circles and particles */}
          <div className="circle blue-circle animated"></div>
          <div className="circle orange-circle animated"></div>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}

          {/* Animated Bars */}
          <div className="bar-container">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bar" style={{ animationDelay: `${i * 0.3}s` }}></div>
            ))}
          </div>

          {/* Enhanced Navbar */}
          <nav className="navbar">
            <div className="logo">Codeforces Analytics</div>
            <div className="nav-buttons">
              <button className="nav-button" onClick={onLoginClick}>
                <i className="fas fa-sign-in-alt"></i> Login/Register
              </button>
              <button className="nav-button" onClick={onUserAnalyticsClick}>
                <i className="fas fa-user"></i> User Analytics
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-text">Discover In-Depth Insights on Codeforces</h1>
            <p className="hero-description">
              Dive into user performance, contest analysis, and problem-solving trends like never before.
            </p>
            <div className="features">
              <div className="feature-card" onClick={onUserAnalyticsClick}>
                <h2>User Insights</h2>
                <p>Track performance metrics, see skill growth, and uncover historical data trends.</p>
              </div>
              <div className="feature-card" onClick={onProblemAnalysisClick}>
                <h2>Problem Analysis</h2>
                <p>Analyze problem difficulty, user success rates, and popular problem types.</p>
              </div>
              <div className="feature-card" onClick={onUserComparisonClick}>
                <h2>User Comparison</h2>
                <p>Compare your performance with another user's on Codeforces.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;

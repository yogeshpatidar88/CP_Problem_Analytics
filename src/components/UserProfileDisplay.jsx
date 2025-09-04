import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import './UserProfileDisplay.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function UserProfileDisplay({ handle, onLogout }) {
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await axios.get(`http://localhost:5000/api/users/profile/${handle}`);
        setUserProfile(profileResponse.data.user);
        
        // Fetch analytics data
        const analyticsResponse = await axios.get(`http://localhost:5000/api/users/analytics/${handle}`);
        setAnalytics(analyticsResponse.data.analytics);
        
        // Fetch recommendations data
        const recommendationsResponse = await axios.get(`http://localhost:5000/api/users/recommendations/${handle}`);
        setRecommendations(recommendationsResponse.data.recommendations);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (handle) {
      fetchUserData();
    }
  }, [handle]);

  const getRatingColor = (rating) => {
    if (rating >= 3000) return '#ff0000';
    if (rating >= 2600) return '#ff8c00';
    if (rating >= 2400) return '#ff8c00';
    if (rating >= 2300) return '#ffcc00';
    if (rating >= 2100) return '#ffcc00';
    if (rating >= 1900) return '#aa00aa';
    if (rating >= 1600) return '#0000ff';
    if (rating >= 1400) return '#03a89e';
    if (rating >= 1200) return '#008000';
    return '#808080';
  };

  const generateChartColors = (length) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors.slice(0, length);
  };

  if (loading) {
    return (
      <div className="user-analytics-container">
        <div className="loading">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-analytics-container">
        <div className="error">
          {error}
          <button onClick={onLogout} className="logout-btn">Back to Login</button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const difficultyData = {
    labels: Object.keys(analytics?.problemDifficulty || {}),
    datasets: [{
      label: 'Problems by Difficulty',
      data: Object.values(analytics?.problemDifficulty || {}),
      backgroundColor: generateChartColors(Object.keys(analytics?.problemDifficulty || {}).length),
      borderWidth: 2,
    }]
  };

  const verdictData = {
    labels: Object.keys(analytics?.verdictDistribution || {}),
    datasets: [{
      label: 'Submission Verdicts',
      data: Object.values(analytics?.verdictDistribution || {}),
      backgroundColor: generateChartColors(Object.keys(analytics?.verdictDistribution || {}).length),
    }]
  };

  const languageData = {
    labels: Object.keys(analytics?.languageDistribution || {}),
    datasets: [{
      label: 'Programming Languages',
      data: Object.values(analytics?.languageDistribution || {}),
      backgroundColor: generateChartColors(Object.keys(analytics?.languageDistribution || {}).length),
    }]
  };

  const monthlyData = {
    labels: Object.keys(analytics?.monthlySubmissions || {}).sort(),
    datasets: [{
      label: 'Monthly Submissions',
      data: Object.keys(analytics?.monthlySubmissions || {}).sort().map(month => analytics.monthlySubmissions[month]),
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.4,
    }]
  };

  const tagsData = {
    labels: Object.keys(analytics?.problemTags || {}).slice(0, 10), // Top 10 tags
    datasets: [{
      label: 'Problem Tags',
      data: Object.keys(analytics?.problemTags || {}).slice(0, 10).map(tag => analytics.problemTags[tag]),
      backgroundColor: generateChartColors(10),
    }]
  };

  return (
    <div className="user-analytics-container">
      <div className="header">
        <h1>Codeforces Analytics: {userProfile?.username}</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          AI Recommendations
        </button>
        <button 
          className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Recent Submissions
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="profile-grid">
          <div className="profile-card">
            <h2>Basic Information</h2>
            <div className="info-row">
              <span className="label">Username:</span>
              <span className="value">{userProfile?.username}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{userProfile?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Country:</span>
              <span className="value">{userProfile?.country || 'Not specified'}</span>
            </div>
          </div>

          <div className="profile-card">
            <h2>Rating Information</h2>
            <div className="rating-display">
              <div className="current-rating">
                <span className="rating-label">Current Rating</span>
                <span 
                  className="rating-value" 
                  style={{ color: getRatingColor(userProfile?.rating) }}
                >
                  {userProfile?.rating}
                </span>
              </div>
              <div className="rating-title">
                <span 
                  className="title-badge"
                  style={{ backgroundColor: getRatingColor(userProfile?.rating) }}
                >
                  {userProfile?.rating_title}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2>Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{userProfile?.problem_count}</div>
                <div className="stat-label">Problems Solved</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{analytics?.totalSubmissions || 0}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="analytics-grid">
          <div className="chart-card">
            <h3>Problem Difficulty Distribution</h3>
            <Bar data={difficultyData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          <div className="chart-card">
            <h3>Submission Verdicts</h3>
            <Pie data={verdictData} options={{ responsive: true }} />
          </div>

          <div className="chart-card">
            <h3>Programming Languages</h3>
            <Doughnut data={languageData} options={{ responsive: true }} />
          </div>

          <div className="chart-card">
            <h3>Monthly Submission Activity</h3>
            <Line data={monthlyData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          <div className="chart-card">
            <h3>Top Problem Tags</h3>
            <Bar data={tagsData} options={{ 
              responsive: true, 
              plugins: { legend: { display: false } },
              indexAxis: 'y'
            }} />
          </div>

          <div className="chart-card">
            <h3>Contest vs Practice</h3>
            <Pie 
              data={{
                labels: Object.keys(analytics?.contestTypes || {}),
                datasets: [{
                  data: Object.values(analytics?.contestTypes || {}),
                  backgroundColor: ['#FF6384', '#36A2EB'],
                }]
              }} 
              options={{ responsive: true }} 
            />
          </div>
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && recommendations && (
        <div className="recommendations-container">
          <div className="recommendations-header">
            <h3>🤖 AI-Powered Problem Recommendations</h3>
            <div className="recommendations-stats">
              <div className="stat-card">
                <span className="stat-label">Your Rating</span>
                <span className="stat-value" style={{ color: getRatingColor(recommendations.userRating) }}>
                  {recommendations.userRating}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Problems Solved</span>
                <span className="stat-value">{recommendations.totalSolved}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Target Range</span>
                <span className="stat-value">{recommendations.recommendedDifficultyRange}</span>
              </div>
            </div>
          </div>

          {recommendations.underusedTags && recommendations.underusedTags.length > 0 && (
            <div className="underused-tags">
              <h4>📈 Topics to Strengthen:</h4>
              <div className="tags-container">
                {recommendations.underusedTags.map((tag, index) => (
                  <span key={index} className="tag-badge underused">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="problems-grid">
            {recommendations.recommendations?.map((problem, index) => (
              <div key={index} className="problem-card">
                <div className="problem-header">
                  <div className="problem-title">
                    <span className="problem-rank">#{problem.rank}</span>
                    <a 
                      href={problem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="problem-name"
                    >
                      {problem.contestId}{problem.index}. {problem.name}
                    </a>
                  </div>
                  <div className="problem-rating" style={{ color: getRatingColor(problem.rating) }}>
                    ⭐ {problem.rating}
                  </div>
                </div>
                
                <div className="problem-tags">
                  {problem.tags?.slice(0, 4).map((tag, tagIndex) => (
                    <span 
                      key={tagIndex} 
                      className={`tag-badge ${recommendations.underusedTags.includes(tag) ? 'highlight' : ''}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {problem.tags?.length > 4 && (
                    <span className="tag-badge more">+{problem.tags.length - 4}</span>
                  )}
                </div>
                
                <div className="problem-reason">
                  💡 <em>{problem.reason}</em>
                </div>
                
                <div className="problem-score">
                  <span className="score-label">AI Score:</span>
                  <span className="score-value">{problem.score}/100</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${Math.min(problem.score, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.analysisMetadata && (
            <div className="analysis-info">
              <h4>📊 Analysis Details:</h4>
              <div className="analysis-grid">
                <div className="analysis-item">
                  <span className="analysis-label">Candidate Problems:</span>
                  <span className="analysis-value">{recommendations.analysisMetadata.candidateProblems}</span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">Avg Tag Frequency:</span>
                  <span className="analysis-value">{recommendations.analysisMetadata.avgTagFrequency}</span>
                </div>
              </div>
              
              {recommendations.analysisMetadata.successRates && (
                <div className="success-rates">
                  <h5>Success Rates by Difficulty:</h5>
                  <div className="rates-grid">
                    {recommendations.analysisMetadata.successRates.map((rate, index) => (
                      <div key={index} className="rate-item">
                        <span className="rate-rating">{rate.rating}</span>
                        <span className="rate-percentage">{rate.successRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Submissions Tab */}
      {activeTab === 'submissions' && analytics && (
        <div className="submissions-container">
          <h3>Recent Submissions</h3>
          <div className="submissions-table">
            <div className="table-header">
              <span>Problem</span>
              <span>Verdict</span>
              <span>Language</span>
              <span>Rating</span>
              <span>Time</span>
            </div>
            {analytics.recentSubmissions?.map((submission, index) => (
              <div key={index} className="table-row">
                <span className="problem-name">{submission.problemName}</span>
                <span className={`verdict ${submission.verdict.toLowerCase().replace('_', '-')}`}>
                  {submission.verdict}
                </span>
                <span className="language">{submission.language}</span>
                <span className="rating" style={{ color: getRatingColor(submission.rating) }}>
                  {submission.rating}
                </span>
                <span className="time">{submission.submissionTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <button 
          className="refresh-btn"
          onClick={async () => {
            setLoading(true);
            try {
              await axios.post('http://localhost:5000/api/users/fetch-codeforces-data', {
                username: handle
              });
              // Refresh data
              const profileResponse = await axios.get(`http://localhost:5000/api/users/profile/${handle}`);
              setUserProfile(profileResponse.data.user);
              
              const analyticsResponse = await axios.get(`http://localhost:5000/api/users/analytics/${handle}`);
              setAnalytics(analyticsResponse.data.analytics);
              
              alert('Data updated successfully!');
            } catch (err) {
              alert('Failed to update data');
            } finally {
              setLoading(false);
            }
          }}
        >
          Refresh All Data
        </button>
      </div>
    </div>
  );
}

export default UserProfileDisplay;

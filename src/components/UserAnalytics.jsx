import React, { useEffect, useState } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './UserAnalytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

function UserAnalytics({ handle, onLogout }) {
  const [userData, setUserData] = useState({
    username: '',
    problem_count: 0,
    average_rating: 0,
    highest_rating: 0,
    first_attempt_percentage: 0,
    problem_tags_count: {},
    verdict_count: {
      OK: 0,
      WRONG_ANSWER: 0,
      TIME_LIMIT_EXCEEDED: 0,
    },
  });
  const [userInfo, setUserInfo] = useState({});
  const [ratingHistory, setRatingHistory] = useState([]);
  const [difficultyData, setDifficultyData] = useState({});
  const [problemTagData, setProblemTagData] = useState({});
  const [contestData, setContestData] = useState([]);
  const [contestStats, setContestStats] = useState({ contest_count: 0, best_rank: 0 });
  const [lastSubmissions, setLastSubmissions] = useState({});
  const [monthlyProblemCount, setMonthlyProblemCount] = useState([]); // New state for monthly problem count
  const [recommendedProblems, setRecommendedProblems] = useState([]); // State for recommended problems
  const [showContestAnalysis, setShowContestAnalysis] = useState(false);
  const [showProblemAnalysis, setShowProblemAnalysis] = useState(false);
  const [showLeaderboardAnalysis, setShowLeaderboardAnalysis] = useState(false); // New state for leaderboard analysis

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDataFile = await import(`../../users/${handle}/${handle}_data.json`);
        const userRatingHistory = await import(`../../users/${handle}/${handle}_user_rating_history.json`);
        const problemCountByRating = await import(`../../users/${handle}/${handle}_problem_count_by_rating.json`);
        const contestCards = await import(`../../users/${handle}/${handle}_contest_cards.json`);
        const contestCountBestRank = await import(`../../users/${handle}/${handle}_contest_count_best_rank.json`);
        const lastSubmissionsData = await import(`../../users/${handle}/submissions/${handle}_last_10_submissions.json`);
        const monthlyProblemCountData = await import(`../../users/${handle}/monthly_problem_count.json`);
        const userBasicInfo = await import(`../../users/${handle}/${handle}_basic_info.json`);
        const recommendedProblemsData = await import(`../../users/${handle}/recommended_problems.json`); // Fetch recommended problems

        setUserData(userDataFile.default);
        setRatingHistory(userRatingHistory.default);
        setDifficultyData(
          problemCountByRating.default.reduce((acc, curr) => {
            acc[curr.diff_rating] = curr.solved_count;
            return acc;
          }, {})
        );
        setUserInfo(userBasicInfo.default[handle]);
        setProblemTagData(userDataFile.default.problem_tags_count);
        setContestData(contestCards.default);
        setContestStats(contestCountBestRank.default[0]);
        setLastSubmissions(lastSubmissionsData.default);
        setMonthlyProblemCount(monthlyProblemCountData.default); // Set monthly problem count
        setRecommendedProblems(recommendedProblemsData.default); // Set recommended problems
      } catch (error) {
        console.error('Error loading data files:', error);
      }
    }

    fetchUserData();
  }, [handle]);

  const handleContestAnalysisClick = () => {
    setShowContestAnalysis(true);
    setShowProblemAnalysis(false);
    setShowLeaderboardAnalysis(false);
  };

  const handleProblemAnalysisClick = () => {
    setShowProblemAnalysis(true);
    setShowContestAnalysis(false);
    setShowLeaderboardAnalysis(false);
  };

  const handleLeaderboardAnalysisClick = () => {
    setShowLeaderboardAnalysis(true);
    setShowContestAnalysis(false);
    setShowProblemAnalysis(false);
  };

  const handleDashboardClick = () => {
    setShowContestAnalysis(false);
    setShowProblemAnalysis(false);
    setShowLeaderboardAnalysis(false);
  };
  const handleRefresh = () => {
  // This function intentionally does nothing
};


  // Graph Data Definitions
  const ratingChartData = {
    labels: ratingHistory.map(entry => new Date(entry.contest_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Rating Over Time',
        data: ratingHistory.map(entry => entry.final_rating),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
    ],
  };

  const averageRatingChartData = {
    labels: ratingHistory.map(entry => new Date(entry.contest_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Average Rating Over Time',
        data: ratingHistory.map(entry => entry.final_rating - 100),
        fill: false,
        borderColor: '#ff9800',
        tension: 0.1,
      },
    ],
  };


  const problemTagsBarChartData = {
    labels: Object.keys(problemTagData || {}),
    datasets: [
      {
        label: 'Problems Solved by Tags',
        data: Object.values(problemTagData || {}),
        backgroundColor: ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0', '#3f51b5'],
      },
    ],
  };

  const problemSolvedByRatingChartData = {
    labels: Object.keys(difficultyData || {}),
    datasets: [
      {
        label: 'Problems Solved by Rating',
        data: Object.values(difficultyData || {}),
        backgroundColor: '#3f51b5',
      },
    ],
  };



  const contestRankChartData = {
    labels: contestData.map(contest => contest.contest_name),
    datasets: [
      {
        label: 'Contest Rank',
        data: contestData.map(contest => contest.contest_rank),
        fill: false,
        borderColor: '#f44336',
        tension: 0.1,
      },
    ],
  };

  const cumulativeRatingChangesChartData = {
    labels: contestData.map(contest => contest.contest_name),
    datasets: [
      {
        label: 'Cumulative Rating Changes',
        data: contestData.map((contest, index) =>
          contestData.slice(0, index + 1).reduce((acc, val) => acc + val.rating_change, 0)
        ),
        fill: false,
        borderColor: '#673ab7',
        tension: 0.1,
      },
    ],
  };

  const monthlyProblemTrendChartData = {
    labels: monthlyProblemCount.map(entry => `${entry.month}/${entry.year}`),
    datasets: [
      {
        label: 'Monthly Problems Solved',
        data: monthlyProblemCount.map(entry => entry.problem_count),
        backgroundColor: '#03a9f4',
      },
    ],
  };

  const problemTagsPieChartData = {
    labels: Object.keys(problemTagData || {}),
    datasets: [
      {
        data: Object.values(problemTagData || {}),
        backgroundColor: ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0', '#3f51b5'],
      },
    ],
  };
  console.log("hello");
  console.log(userInfo);
  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="user-info">
          <img src="https://via.placeholder.com/40" alt="User" className="user-avatar" />
          <div className="user-details">
            <h4>{userData.username || 'N/A'}</h4>
            <p>Rating: {userInfo.rating}</p>

            <p>Title: {userInfo.rating_title}</p>
          </div>
        </div>
        <div className="nav-links">
          <button onClick={handleDashboardClick} className={`nav-link ${!showContestAnalysis && !showProblemAnalysis ? 'active' : ''}`}>
            Dashboard
          </button>
          <button onClick={handleContestAnalysisClick} className={`nav-link ${showContestAnalysis ? 'active' : ''}`}>
            Contest Analysis
          </button>
          <button onClick={handleProblemAnalysisClick} className={`nav-link ${showProblemAnalysis ? 'active' : ''}`}>
            Problem Analysis
          </button>
          <button onClick={handleLeaderboardAnalysisClick} className={`nav-link ${showLeaderboardAnalysis ? 'active' : ''}`}>
            Recommended Problems
          </button>
          <button onClick={onLogout} className="nav-link">Logout</button>
          <button onClick={handleRefresh} className="aa">
            Refresh
          </button>
        </div>
      </div>

      <div className="main-content">
        {!showContestAnalysis && !showProblemAnalysis && !showLeaderboardAnalysis && (
          <>
            <div className="statistics">
              <div className="stat-card">
                <h3>{userData.problem_count || 0}</h3>
                <p>Problems Solved</p>
              </div>
              <div className="stat-card">
                <h3>{userData.average_rating.toFixed(2) || 0}</h3>
                <p>Mean Rating of Problem Solved</p>
              </div>
              <div className="stat-card">
                <h3>{userInfo.max_rating || 0}</h3>
                <p>Peak rating</p>
              </div>
              <div className="stat-card">
                <h3>{userData.first_attempt_percentage?.toFixed(2) || '0.00'}%</h3>
                <p>First Attempt Success Rate</p>
              </div>
              <div className="stat-card">
                <h3>{contestStats.contest_count || 0}</h3>
                <p>Contests Participated</p>
              </div>
              <div className="stat-card">
                <h3>{contestStats.best_rank || 'N/A'}</h3>
                <p>Best Rank</p>
              </div>
            </div>

            <div className="chart-row">
              <div className="panel">
                <h4>Rating History</h4>
                <Line data={ratingChartData} />
              </div>
              <div className="panel">
                <h4>Average Rating Over Time</h4>
                <Line data={averageRatingChartData} />
              </div>
            </div>

            <div className="chart-row">
              <div className="panel">
                <h4>Problems Solved by Tags</h4>
                <Bar data={problemTagsBarChartData} />
              </div>
              <div className="panel">
                <h4>Problems Solved by Rating</h4>
                <Bar data={problemSolvedByRatingChartData} />
              </div>
            </div>
          </>
        )}

        {showContestAnalysis && (
          <div className="contest-analysis">
            <h2>Contest Analysis</h2>
            <div className="card-slider">
              {contestData.map((contest, index) => (
                <div key={index} className="contest-card">
                  <h3>{contest.contest_name}</h3>
                  <p><strong>Rank:</strong> {contest.contest_rank}</p>
                  <p><strong>Rating Change:</strong> {contest.rating_change}</p>
                  <p><strong>Problems Solved:</strong> {contest.problems_solved}</p>
                  <p><strong>Penalty:</strong> {contest.penalty}</p>
                </div>
              ))}
            </div>
            <div className="panel">
              <h4>Contest Rank History</h4>
              <Line data={contestRankChartData} />
            </div>
            <div className="panel">
              <h4>Cumulative Rating Changes</h4>
              <Line data={cumulativeRatingChangesChartData} />
            </div>
          </div>
        )}

        {showProblemAnalysis && (
          <div className="problem-analysis">
            <h2>Problem Analysis</h2>
            <div className="card-slider">
              {Object.entries(lastSubmissions)
                .slice(0, 10)
                .map(([problemName, submission], index) => (
                  <div key={submission.submission_id} className="problem-card">
                    <h3>{problemName}</h3>
                    <p><strong>Contest:</strong> {submission.contest_name}</p>
                    <p><strong>Problem ID:</strong> {submission.problem_id}</p>
                    <p><strong>Verdict:</strong> {submission.verdict}</p>
                    <p><strong>Execution Time:</strong> {submission.execution_time} ms</p>
                    <p><strong>Memory Used:</strong> {submission.memory_used}</p>
                    <p><strong>Language:</strong> {submission.language_used}</p>
                    <p><strong>Rating:</strong> {submission.diff_rating}</p>
                  </div>
                ))}
            </div>

            <div className="chart-cards">
              <div className="chart-card">
                <h4>Monthly Problem Solving Trend</h4>
                <Bar data={monthlyProblemTrendChartData} />
              </div>
              <div className="chart-card">
                <h4>Problem Tags Distribution</h4>
                <Pie data={problemTagsPieChartData} />
              </div>
              <div className="chart-card">
                <h4>Problems Solved by Rating</h4>
                <Bar data={problemSolvedByRatingChartData} />
              </div>
            </div>
          </div>
        )}
        {/* Recommended Problems Section */}
        {showLeaderboardAnalysis && (
          <div className="leaderboard-analysis">
            <h2>Recommended Problems</h2>
            <div className="recommended-problems-list">
              {recommendedProblems.map((problem, index) => (
                <div key={index} className="problem-card">
                  <div className="problem-info-box">
                    <h4>Problem ID: {problem.problem_id}</h4>
                    <p><strong>Difficulty Rating:</strong> {problem.diff_rating}</p>
                    <a href={problem.hyperlink} target="_blank" rel="noopener noreferrer">View Problem</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default UserAnalytics;
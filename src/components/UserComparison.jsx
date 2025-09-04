import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import './UserComparison.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const UserComparison = ({ onBackToHome }) => {
  const [user1Handle, setUser1Handle] = useState('');
  const [user2Handle, setUser2Handle] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [error, setError] = useState(null);

  const [userData1, setUserData1] = useState({});
  const [userData2, setUserData2] = useState({});
  const [ratingHistory1, setRatingHistory1] = useState([]);
  const [ratingHistory2, setRatingHistory2] = useState([]);
  const [contestData1, setContestData1] = useState([]);
  const [contestData2, setContestData2] = useState([]);

  const handleCompareUsers = () => {
    if (user1Handle && user2Handle) {
      setLoading(true);
      setDataFetched(false);
      setError(null);

      Promise.all([
        import(`../../users/${user1Handle}/${user1Handle}_data.json`),
        import(`../../users/${user2Handle}/${user2Handle}_data.json`),
        import(`../../users/${user1Handle}/${user1Handle}_user_rating_history.json`),
        import(`../../users/${user2Handle}/${user2Handle}_user_rating_history.json`),
        import(`../../users/${user1Handle}/${user1Handle}_contest_cards.json`),
        import(`../../users/${user2Handle}/${user2Handle}_contest_cards.json`),
      ])
        .then(([userData1, userData2, ratingHistory1, ratingHistory2, contestData1, contestData2]) => {
          setUserData1(userData1.default);
          setUserData2(userData2.default);
          setRatingHistory1(ratingHistory1.default);
          setRatingHistory2(ratingHistory2.default);
          setContestData1(contestData1.default);
          setContestData2(contestData2.default);
          setDataFetched(true);
        })
        .catch((err) => {
          setError('Error fetching data');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleBackToForm = () => {
    setDataFetched(false);
    setUser1Handle('');
    setUser2Handle('');
  };

  const ratingComparisonData = {
    labels: ratingHistory1.map(entry => new Date(entry.contest_date).toLocaleDateString()),
    datasets: [
      {
        label: `${user1Handle} Rating`,
        data: ratingHistory1.map(entry => entry.final_rating),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2Handle} Rating`,
        data: ratingHistory2.map(entry => entry.final_rating),
        fill: false,
        borderColor: '#ff9800',
        tension: 0.1,
      },
    ],
  };

  // Monthly Problem Solving Trend
  const monthlyProblemTrendData = {
    labels: [...new Set([...ratingHistory1.map(entry => entry.contest_date.split('-')[1]), ...ratingHistory2.map(entry => entry.contest_date.split('-')[1])])],
    datasets: [
      {
        label: `${user1Handle} Monthly Trend`,
        data: ratingHistory1.reduce((acc, entry) => {
          const month = entry.contest_date.split('-')[1];
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {}),
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2Handle} Monthly Trend`,
        data: ratingHistory2.reduce((acc, entry) => {
          const month = entry.contest_date.split('-')[1];
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {}),
        backgroundColor: '#ff9800',
      },
    ],
  };

  const cumulativeRatingChangesData = {
    labels: contestData1.map(contest => contest.contest_name),
    datasets: [
      {
        label: `${user1Handle} Cumulative Rating Changes`,
        data: contestData1.map((contest, index) => contestData1.slice(0, index + 1).reduce((acc, val) => acc + val.rating_change, 0)),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2Handle} Cumulative Rating Changes`,
        data: contestData2.map((contest, index) => contestData2.slice(0, index + 1).reduce((acc, val) => acc + val.rating_change, 0)),
        fill: false,
        borderColor: '#ff9800',
        tension: 0.1,
      },
    ],
  };

  const problemsSolvedComparisonData = {
    labels: ['Problems Solved'],
    datasets: [
      {
        label: `${user1Handle} Problems Solved`,
        data: [userData1.problem_count],
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2Handle} Problems Solved`,
        data: [userData2.problem_count],
        backgroundColor: '#ff9800',
      },
    ],
  };

  const rankInContestsComparisonData = {
    labels: contestData1.map(contest => contest.contest_name),
    datasets: [
      {
        label: `${user1Handle} Rank`,
        data: contestData1.map(contest => contest.contest_rank),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2Handle} Rank`,
        data: contestData2.map(contest => contest.contest_rank),
        fill: false,
        borderColor: '#ff9800',
        tension: 0.1,
      },
    ],
  };

  const rankComparisonData = {
    labels: ['Highest Rank', 'Lowest Rank'],
    datasets: [
      {
        label: `${user1Handle}`,
        data: [Math.min(...contestData1.map(contest => contest.contest_rank)), Math.max(...contestData1.map(contest => contest.contest_rank))],
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2Handle}`,
        data: [Math.min(...contestData2.map(contest => contest.contest_rank)), Math.max(...contestData2.map(contest => contest.contest_rank))],
        backgroundColor: '#ff9800',
      },
    ],
  };

  const currentRatingComparisonData = {
    labels: [user1Handle, user2Handle],
    datasets: [
      {
        label: 'Current Rating',
        data: [userData1.average_rating, userData2.average_rating],
        backgroundColor: ['#82e9de', '#ff9800'],
      },
    ],
  };

  return (
    <div className="user-comparison">
      <h1>User Comparison</h1>
      {!dataFetched ? (
        <div className="input-container">
          <label htmlFor="user1Handle">Enter first user handle:</label>
          <input
            id="user1Handle"
            type="text"
            placeholder="Enter first user handle"
            value={user1Handle}
            onChange={(e) => setUser1Handle(e.target.value)}
          />
          <label htmlFor="user2Handle">Enter second user handle:</label>
          <input
            id="user2Handle"
            type="text"
            placeholder="Enter second user handle"
            value={user2Handle}
            onChange={(e) => setUser2Handle(e.target.value)}
          />
          <button onClick={handleCompareUsers} disabled={loading}>
            {loading ? 'Loading...' : 'Compare Users'}
          </button>
          <button className="back-button-home" onClick={onBackToHome}>
            Back to Homepage
          </button>
        </div>
      ) : (
        <div className="comparison-results">
          {/* Back Button to Comparison Form */}
          <button className="back-button" onClick={handleBackToForm}>
            Back to Compare Users
          </button>

          {/* Comparison Graphs */}
          <div className="charts">
            <div className="chart-card">
              <h4>Rating History Comparison</h4>
              <Line data={ratingComparisonData} />
            </div>
            <div className="chart-card">
              <h4>Monthly Problem Solving Trend</h4>
              <Bar data={monthlyProblemTrendData} />
            </div>
            <div className="chart-card">
              <h4>Cumulative Rating Changes</h4>
              <Line data={cumulativeRatingChangesData} />
            </div>
            <div className="chart-card">
              <h4>Problems Solved Comparison</h4>
              <Bar data={problemsSolvedComparisonData} />
            </div>
            <div className="chart-card">
              <h4>Rank in Contests Comparison</h4>
              <Line data={rankInContestsComparisonData} />
            </div>
            <div className="chart-card">
              <h4>Rank Comparison</h4>
              <Bar data={rankComparisonData} />
            </div>
            <div className="chart-card">
              <h4>Current Rating Comparison</h4>
              <Bar data={currentRatingComparisonData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserComparison;

import React, { useState, useEffect } from 'react';
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

const ComparisonResults = ({ user1, user2, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData1, setUserData1] = useState({});
  const [userData2, setUserData2] = useState({});
  const [ratingHistory1, setRatingHistory1] = useState([]);
  const [ratingHistory2, setRatingHistory2] = useState([]);
  const [contestData1, setContestData1] = useState([]);
  const [contestData2, setContestData2] = useState([]);

  useEffect(() => {
    const fetchUser = async (username) => {
      const fileTypes = ['data', 'user_rating_history', 'contest_cards'];
      const results = await Promise.all(fileTypes.map(type =>
        fetch(`http://localhost:5000/api/users/${encodeURIComponent(username)}/${type}`).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${type} for ${username}`);
          return res.json();
        })
      ));
      return {
        data: results[0],
        ratingHistory: results[1],
        contestCards: results[2]
      };
    };

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [u1, u2] = await Promise.all([fetchUser(user1), fetchUser(user2)]);
        setUserData1(u1.data || {});
        setUserData2(u2.data || {});
        setRatingHistory1(Array.isArray(u1.ratingHistory) ? u1.ratingHistory : []);
        setRatingHistory2(Array.isArray(u2.ratingHistory) ? u2.ratingHistory : []);
        setContestData1(Array.isArray(u1.contestCards) ? u1.contestCards : []);
        setContestData2(Array.isArray(u2.contestCards) ? u2.contestCards : []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch comparison data');
      } finally {
        setLoading(false);
      }
    })();
  }, [user1, user2]);

  if (loading) return <div className="comparison-results"><p>Loading comparison...</p></div>;
  if (error) return <div className="comparison-results"><p>{error}</p><button onClick={onBack}>Back</button></div>;

  const ratingComparisonData = {
    labels: ratingHistory1.map(entry => new Date(entry.contest_date).toLocaleDateString()),
    datasets: [
      {
        label: `${user1} Rating`,
        data: ratingHistory1.map(entry => entry.final_rating),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2} Rating`,
        data: ratingHistory2.map(entry => entry.final_rating),
        fill: false,
        borderColor: '#ff9800',
        tension: 0.1,
      },
    ],
  };

  const monthlyProblemTrendData = {
    labels: [...new Set([...ratingHistory1.map(entry => entry.contest_date.split('-')[1]), ...ratingHistory2.map(entry => entry.contest_date.split('-')[1])])],
    datasets: [
      {
        label: `${user1} Monthly Trend`,
        data: ratingHistory1.reduce((acc, entry) => {
          const month = entry.contest_date.split('-')[1];
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {}),
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2} Monthly Trend`,
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
        label: `${user1} Cumulative Rating Changes`,
        data: contestData1.map((contest, index) => contestData1.slice(0, index + 1).reduce((acc, val) => acc + val.rating_change, 0)),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2} Cumulative Rating Changes`,
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
        label: `${user1} Problems Solved`,
        data: [userData1.problem_count],
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2} Problems Solved`,
        data: [userData2.problem_count],
        backgroundColor: '#ff9800',
      },
    ],
  };

  return (
    <div className="comparison-results">
      <button onClick={onBack}>Back</button>
      <h2>Comparison: {user1} vs {user2}</h2>
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
      </div>
    </div>
  );
};

export default ComparisonResults;

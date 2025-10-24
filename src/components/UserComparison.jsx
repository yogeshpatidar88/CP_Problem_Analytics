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

const UserComparison = ({ onBackToHome, onShowResults }) => {
  const [users, setUsers] = useState([]);
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [error, setError] = useState(null);

  const [userData1, setUserData1] = useState({});
  const [userData2, setUserData2] = useState({});
  const [ratingHistory1, setRatingHistory1] = useState([]);
  const [ratingHistory2, setRatingHistory2] = useState([]);
  const [contestData1, setContestData1] = useState([]);
  const [contestData2, setContestData2] = useState([]);
  const [compareJson, setCompareJson] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(response => response.json())
      .then(data => {
        // ensure we store an array; if API returns an object with message, default to []
        if (Array.isArray(data)) setUsers(data);
        else if (data && Array.isArray(data.userFolders)) setUsers(data.userFolders);
        else setUsers([]);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setUsers([]);
      });
  }, []);

  const handleUser1Change = (event) => {
    const selectedUser = event.target.value;
    setUser1(selectedUser);
    // Clear previously loaded data for this user until Compare is clicked
    setUserData1({});
    setRatingHistory1([]);
    setContestData1([]);
  };

  const handleUser2Change = (event) => {
    const selectedUser = event.target.value;
    setUser2(selectedUser);
    // Clear previously loaded data for this user until Compare is clicked
    setUserData2({});
    setRatingHistory2([]);
    setContestData2([]);
  };

  // No local/static user data lookup anymore — we'll fetch from the backend when Compare is clicked.

  const handleCompareUsers = async () => {
    if (!user1 || !user2) {
      setError('Please enter two user handles to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    setCompareJson(null);
    try {
  // Call backend explicitly on port 5000 so the dev-server proxy (or missing proxy) doesn't block the request
  const res = await fetch(`http://localhost:5000/api/compare/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Compare request failed');
      }
      const data = await res.json();
      setCompareJson(data);
      setDataFetched(true);
    } catch (err) {
      console.error('Compare fetch error', err);
      setError(err.message || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  // Return HTML string with basic JSON syntax highlighting
  const syntaxHighlight = (obj) => {
    if (!obj) return '';
    const json = JSON.stringify(obj, null, 2);
    const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^\"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class=\"${cls}\">${match}</span>`;
    });
  };

  const handleBackToForm = () => {
    setDataFetched(false);
    setUser1('');
    setUser2('');
  };

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

  // Monthly Problem Solving Trend
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

  const rankInContestsComparisonData = {
    labels: contestData1.map(contest => contest.contest_name),
    datasets: [
      {
        label: `${user1} Rank`,
        data: contestData1.map(contest => contest.contest_rank),
        fill: false,
        borderColor: '#82e9de',
        tension: 0.1,
      },
      {
        label: `${user2} Rank`,
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
        label: `${user1}`,
        data: [Math.min(...contestData1.map(contest => contest.contest_rank)), Math.max(...contestData1.map(contest => contest.contest_rank))],
        backgroundColor: '#82e9de',
      },
      {
        label: `${user2}`,
        data: [Math.min(...contestData2.map(contest => contest.contest_rank)), Math.max(...contestData2.map(contest => contest.contest_rank))],
        backgroundColor: '#ff9800',
      },
    ],
  };

  const currentRatingComparisonData = {
    labels: [user1, user2],
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
          <label htmlFor="user1Handle">First user (type handle):</label>
          <input list="usersList" id="user1Handle" value={user1} onChange={handleUser1Change} placeholder="e.g. tourist" />
          <label htmlFor="user2Handle">Second user (type handle):</label>
          <input list="usersList" id="user2Handle" value={user2} onChange={handleUser2Change} placeholder="e.g. Petr" />
          <datalist id="usersList">
            {users.map(u => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <button onClick={handleCompareUsers} disabled={loading}>
            {loading ? 'Loading...' : 'Compare Users'}
          </button>
          <button className="back-button-home" onClick={onBackToHome}>
            Back to Homepage
          </button>
        </div>
      ) : (
        <div className="comparison-results">
          <button className="back-button" onClick={handleBackToForm}>
            Back to Compare Users
          </button>

          {error && <p className="error">{error}</p>}

          {compareJson ? (
            <div className="json-output">
              
              <div className="json-columns">
                <div className="json-column">
                  <h4 style={{ textAlign: 'center', color: '#82e9de' }}>{compareJson.user1?.username || user1}</h4>
                  <pre className="json-pre" dangerouslySetInnerHTML={{ __html: syntaxHighlight(compareJson.user1) }} />
                </div>
                <div className="json-column">
                  <h4 style={{ textAlign: 'center', color: '#ff9800' }}>{compareJson.user2?.username || user2}</h4>
                  <pre className="json-pre" dangerouslySetInnerHTML={{ __html: syntaxHighlight(compareJson.user2) }} />
                </div>
              </div>
            </div>
          ) : (
            <p>No comparison JSON available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserComparison;

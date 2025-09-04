import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import axios from 'axios';
import './ProblemData.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function ProblemAnalysis({ onBackToHome }) {
    const [problemNumber, setProblemNumber] = useState('');
    const [problemData, setProblemData] = useState(null);
    const [error, setError] = useState(null);
    const [showButton, setShowButton] = useState(true); // Track scroll position

    const handleFetchProblemData = async () => {
        if (!problemNumber) {
            setError('Please enter a problem number.');
            return;
        }

        try {
            // Call the backend API to generate problem analysis
            const response = await axios.post('http://localhost:5000/api/users/problems/analysis', {
                problem_id: problemNumber
            });

            setProblemData(response.data);
            setError(null);
        } catch (err) {
            setError('Error fetching problem data. Please check the problem number.');
            console.error(err);
            setProblemData(null);
        }
    };

    // Handle scroll event to detect top position
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY === 0) {
                setShowButton(true); // Show button when at the top
            } else {
                setShowButton(false); // Hide button when scrolled down
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Clean up the event listener
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const acceptanceRateData = problemData && {
        labels: ['Accepted', 'Not Accepted'],
        datasets: [
            {
                data: [
                    problemData.problem_acceptance_rate.acceptance_rate,
                    100 - problemData.problem_acceptance_rate.acceptance_rate,
                ],
                backgroundColor: ['#4caf50', '#f44336'],
            },
        ],
    };

    // Check if 'difficulty_perception' is an array and if not handle gracefully
    const difficultyChartData = problemData && problemData.difficulty_perception && problemData.difficulty_perception.difficulty_perception ? {
        labels: ['Average User Rating', 'Successful Submission Count'],
        datasets: [
            {
                label: 'Difficulty Perception',
                data: [
                    problemData.difficulty_perception.difficulty_perception.average_user_rating,
                    problemData.difficulty_perception.difficulty_perception.successful_submission_count,
                ],
                backgroundColor: '#03a9f4',
            },
        ],
    } : null;

    // New Data: Submissions by User Rating Title
    const ratingTitleData = problemData && problemData.submissions_by_user_rating_title ? {
        labels: problemData.submissions_by_user_rating_title.submissions_by_rating_title.map(
            (entry) => entry.rating_title
        ),
        datasets: [
            {
                data: problemData.submissions_by_user_rating_title.submissions_by_rating_title.map(
                    (entry) => entry.user_count
                ),
                backgroundColor: ['#ffeb3b', '#8bc34a', '#f44336', '#03a9f4'],
            },
        ],
    } : null;

    // New Data: Average Submissions to Solve
    const averageSubmissionsToSolve = problemData && problemData.average_submissions_to_solve ? problemData.average_submissions_to_solve.average_submissions_to_solve : null;

    return (
        <div className="problem-analysis-container">
            {/* Back to Homepage Button */}
            <button
                className={`back-button ${showButton ? 'visible' : ''}`} 
                onClick={onBackToHome}
            >
                Back to Homepage
            </button>

            <h1>Problem Analysis</h1>

            {/* Problem Input */}
            <div className="problem-input">
                <label htmlFor="problemNumber">Enter Problem Number:</label>
                <input
                    id="problemNumber"
                    type="text"
                    value={problemNumber}
                    onChange={(e) => setProblemNumber(e.target.value)}
                    placeholder="e.g., 1651_C"
                />
                <button onClick={handleFetchProblemData}>Fetch Data</button>
            </div>

            {error && <p className="error">{error}</p>}

            {problemData && (
                <>
                    {/* Problem Statistics */}
                    <h2>Problem Stats for {problemData.problem_id}</h2>

                    <div className="problem-info-cards">
                        {/* Acceptance Rate */}
                        <div className="info-card">
                            <h3>Acceptance Rate</h3>
                            <input
                                type="text"
                                readOnly
                                value={`${problemData.problem_acceptance_rate.acceptance_rate}%`}
                            />
                        </div>

                        {/* Unique User Interactions */}
                        <div className="info-card">
                            <h3>Unique User Interactions</h3>
                            <input
                                type="text"
                                readOnly
                                value={problemData.user_interaction_with_problem.unique_user_interactions}
                            />
                        </div>

                        {/* Common Errors */}
                        <div className="info-card">
                            <h3>Common Errors</h3>
                            <textarea
                                readOnly
                                value={problemData.common_errors_on_problem.common_errors
                                    .map((error) => `${error.verdict}: ${error.error_count} occurrences`)
                                    .join('\n')}
                            />
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="chart-section">
                        <div className="chart-card">
                            <h4>Acceptance Rate</h4>
                            <Pie data={acceptanceRateData} />
                        </div>
                        <div className="chart-card">
                            <h4>Difficulty Perception</h4>
                            {difficultyChartData ? <Bar data={difficultyChartData} /> : <p>No data available</p>}
                        </div>
                        {/* New Charts Section */}
                        {ratingTitleData && (
                            <div className="chart-card">
                                <h4>Submissions by User Rating Title</h4>
                                <Pie data={ratingTitleData} />
                            </div>
                        )}
                    </div>

                    {/* Average Submissions to Solve as Text Box */}
                    {averageSubmissionsToSolve !== null && (
                        <div className="info-card">
                            <h3>Average Submissions to Solve</h3>
                            <input
                                type="text"
                                readOnly
                                value={averageSubmissionsToSolve}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ProblemAnalysis;

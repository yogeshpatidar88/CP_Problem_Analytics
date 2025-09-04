# 🏆 Codeforces Helper

**Codeforces Helper** is a tool designed to assist competitive programmers in solving Codeforces problems more efficiently. It provides features like problem searching, contest tracking, solution hints, and practice analytics — all in one user-friendly interface.

## 👨‍💻 Project Team

| Name           | Roll Number |
| -------------- | ----------- |
| Yogesh Patidar | 220004055   |
| Pratik Prajn   | 220005039   |
| Roshan Saini   | 220004038   |

## 🚀 Features

### 🔍 Problem Search & Filtering

* Search problems by **tags**, **difficulty**, **rating**, or **contest**
* Filter problems by solved/unsolved status
* Direct link to problem page on Codeforces

### 🧩 Contest Tracker

* View **upcoming contests** and their timings
* Track **ongoing contests**
* Add contests to personal calendar

### 💡 Solution Helper

* Provide hints or solution approaches for selected problems
* Fetch **accepted solutions** from Codeforces community
* Analyze problem patterns for faster solving

### 📊 Performance Analytics

* Track **personal problem-solving stats**
* Graphs for problem ratings, solved tags, and performance trends
* Compare performance with friends or top-rated coders

### 👤 User Dashboard

* My Problems: View solved/unsolved problems
* My Contests: Track upcoming and past contests
* Leaderboard: Compare performance with peers

## 🌐 Tech Highlights

* Uses **Codeforces API** to fetch problems, contests, and user stats
* Built with **React** for frontend, **Node.js** and **Express** for backend
* **MongoDB** database to track user progress and stats
* Responsive UI for mobile and desktop

## 🏗️ Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Frontend   | React, JavaScript, Tailwind CSS |
| Backend    | Node.js, Express.js             |
| Database   | MongoDB                         |
| API        | Codeforces API                  |
| Deployment | Heroku / Vercel                 |

## 🛠️ Getting Started

### ✅ Prerequisites

* Node.js v16.x or later
* npm v8.x or later
* MongoDB Atlas account or local MongoDB
* Git

### 🔧 Project Setup

```bash
git clone https://github.com/yourusername/codeforces-helper.git
cd codeforces-helper
```

### Install Dependencies

```bash
npm install
cd frontend
npm install
```

### 📄 Environment Configuration

Create a `.env` file in the root directory:

```ini
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

### 🖥️ Running the Project

```bash
# Start backend
npm run server

# Start frontend
cd frontend
npm start
```

Visit the app at [http://localhost:3000](http://localhost:3000)

## 🔮 Future Enhancements

* Real-time contest notifications
* AI-powered hints and solution suggestions
* Personalized problem recommendation engine
* Dark mode and theme customization
* Export solved problems and stats to PDF

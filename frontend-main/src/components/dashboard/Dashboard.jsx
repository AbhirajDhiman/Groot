import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar";
import { API_BASE_URL } from "../../config/api";

const Dashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/repo/user/${userId}`);
        const data = await response.json();
        const userRepos = Array.isArray(data.repositories) ? data.repositories : [];
        setRepositories(userRepos);
      } catch (err) {
        console.error("Error while fetching user repositories: ", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/repo/all`);
        const data = await response.json();
        const allRepos = Array.isArray(data) ? data : (data.repositories || []);
        setSuggestedRepositories(allRepos);
      } catch (err) {
        console.error("Error while fetching all repositories: ", err);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(repositories);
    } else {
      const filteredRepo = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredRepo);
    }
  }, [searchQuery, repositories]);

  return (
    <>
      <Navbar />
      <section id="dashboard">
        <aside>
          <h3>Explore Repositories</h3>
          {suggestedRepositories.length === 0 ? (
            <p style={{ color: "#8b949e", fontSize: "14px" }}>No public repositories yet.</p>
          ) : (
            suggestedRepositories.map((repo) => (
              <div key={repo._id} style={{ marginBottom: "12px" }}>
                <h4 style={{ color: "#58a6ff" }}>{repo.name}</h4>
                <p style={{ color: "#8b949e", fontSize: "13px" }}>{repo.description || "No description provided"}</p>
              </div>
            ))
          )}
        </aside>
        <main>
          <h2>Your Repositories</h2>
          <div id="search">
            <input
              type="text"
              value={searchQuery}
              placeholder="Search your repositories..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <p style={{ color: "#8b949e" }}>Loading repositories...</p>
          ) : searchResults.length === 0 ? (
            <div style={{ color: "#8b949e", marginTop: "20px" }}>
              <p>No repositories found. Create your first repository!</p>
            </div>
          ) : (
            searchResults.map((repo) => (
              <div key={repo._id} style={{ padding: "12px 0", borderBottom: "1px solid #30363d" }}>
                <h4 style={{ color: "#58a6ff" }}>{repo.name}</h4>
                <p style={{ color: "#8b949e", fontSize: "13px" }}>{repo.description || "No description"}</p>
              </div>
            ))
          )}
        </main>
        <aside>
          <h3>Groot VCS Activity</h3>
          <ul>
            <li>
              <p>Branchless snapshots enabled</p>
            </li>
            <li>
              <p>AWS S3 Cloud Sync active</p>
            </li>
            <li>
              <p>REST API Engine on port 3000</p>
            </li>
          </ul>
        </aside>
      </section>
    </>
  );
};

export default Dashboard;

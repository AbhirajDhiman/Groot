import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import { API_BASE_URL } from "../../config/api";
import { Button } from "@primer/react";
import "./dashboard.css";

const CreateRepo = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Repository name is required.");
      return;
    }

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId) {
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/repo/create`,
        {
          name: name.trim(),
          description: description.trim(),
          visibility: visibility,
          owner: userId,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error("Error creating repository:", err);
      const msg = err.response?.data?.error || "Failed to create repository.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", color: "#c9d1d9" }}>
        <h2 style={{ borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>Create a new Groot repository</h2>
        <p style={{ color: "#8b949e", fontSize: "14px", marginBottom: "20px" }}>
          A repository contains all project files, including the revision history.
        </p>

        {error && (
          <div style={{ color: "#f85149", backgroundColor: "#3a1d1d", padding: "10px", borderRadius: "6px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Repository name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., my-awesome-project"
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: "6px",
                color: "#c9d1d9",
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your repository"
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: "6px",
                color: "#c9d1d9",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Visibility</label>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === true}
                  onChange={() => setVisibility(true)}
                />
                Public
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === false}
                  onChange={() => setVisibility(false)}
                />
                Private
              </label>
            </div>
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "10px" }}
          >
            {loading ? "Creating..." : "Create repository"}
          </Button>
        </form>
      </div>
    </>
  );
};

export default CreateRepo;

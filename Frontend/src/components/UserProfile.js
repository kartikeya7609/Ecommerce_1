import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiMail,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiGlobe,
} from "react-icons/fi";
import "./UserProfile.css";
import { useAuth } from "./AuthContext";

const UserProfile = ({ user, userId }) => {
  const auth = useAuth(); // Get auth context
  const [profileData, setProfileData] = useState(user || null);
  const [activeTab, setActiveTab] = useState("about");
  const [availableTabs, setAvailableTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(!user);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      // User data passed via prop, no fetch needed
      setProfileData(user);
      setIsLoading(false);
      setError(null);
      return;
    }
    const targetUserId = userId || auth?.user?.id;

    console.log("Auth context:", auth); // Debug log
    console.log("Auth user:", auth?.user); // Debug log
    console.log("Target user ID:", targetUserId); // Debug log

    if (!targetUserId) {
      setError("No user ID provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    console.log(
      "Using token for fetch:",
      token ? "Token exists" : "No token found"
    );

    fetch(`http://localhost:3002/api/user/${targetUserId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("Profile API response status:", res.status);

        if (!res.ok) {
          // Try to get the error message from the response
          const errorData = await res
            .json()
            .catch((e) => ({ error: "Could not parse error response" }));
          console.error("API error response:", errorData);
          throw new Error(
            `User not found or server error: ${res.status} ${
              errorData.error || ""
            }`
          );
        }
        return res.json();
      })
      .then((data) => {
        console.log("Profile API response data:", data);
        if (!data) {
          console.error("Invalid user data structure:", data);
          throw new Error("Invalid user data structure");
        }
        // Check if data is already the user object or if it's wrapped in a user property
        const userData = data.user || data;
        setProfileData(userData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load user profile:", err.message);
        setError(`Failed to load user profile: ${err.message}`);
        setIsLoading(false);
      });
  }, [user, userId, auth]);

  // Update tabs when profileData changes or activeTab changes
  useEffect(() => {
    if (!profileData) return;

    const tabs = [
      { id: "about", hasContent: !!profileData.bio },
      { id: "experience", hasContent: profileData.experience?.length > 0 },
      { id: "skills", hasContent: profileData.skills?.length > 0 },
    ].filter((tab) => tab.hasContent);

    setAvailableTabs(tabs);

    // Ensure active tab is valid
    const validTab = tabs.find((t) => t.id === activeTab);
    if (!validTab && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [profileData, activeTab]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profileData) {
    return <p className="error-message">Error: {error}</p>;
  }

  if (!profileData) {
    return <p>No profile data available.</p>;
  }

  const {
    name = "Anonymous",
    email,
    username,
    bio,
    location,
    website,
    social = {},
    skills = [],
    experience = [],
  } = profileData;

  return (
    <motion.div
      className="profile-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-image">{getInitials(name)}</div>
          <div className="online-status" />
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{name}</h1>
          <p className="profile-title">
            {username && `@${username}`} {location && `• ${location}`}
          </p>
        </div>

        <div className="profile-social">
          {email && (
            <a href={`mailto:${email}`} className="social-link">
              <FiMail />
            </a>
          )}
          {social.github && (
            <a
              href={`https://github.com/${social.github}`}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiGithub />
            </a>
          )}
          {social.linkedin && (
            <a
              href={`https://linkedin.com/in/${social.linkedin}`}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiLinkedin />
            </a>
          )}
          {social.twitter && (
            <a
              href={`https://twitter.com/${social.twitter}`}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiTwitter />
            </a>
          )}
          {website && (
            <a
              href={`https://${website}`}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiGlobe />
            </a>
          )}
        </div>
      </div>

      {availableTabs.length > 0 && (
        <div className="profile-tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="profile-content">
        {activeTab === "about" && (
          <div className="tab-content">
            {bio ? <p>{bio}</p> : <p>No bio available.</p>}
          </div>
        )}

        {activeTab === "experience" && (
          <div className="tab-content">
            {experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <h3>{exp.role}</h3>
                <p>{exp.company}</p>
                <p>{exp.period}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="tab-content">
            <ul className="skills-list">
              {skills.map((skill, index) => (
                <li key={index} className="skill-item">
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="btn btn-primary mt-3"
          onClick={() => (window.location.href = "/home")}
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  );
};

export default UserProfile;

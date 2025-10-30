"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import learningPathsData from "../../data/learningPaths.json";
import { CheckCircle2, Circle, Award, Plus, Target, TrendingUp } from "lucide-react";
import "./learning-paths.css";

interface Milestone {
  title: string;
  description: string;
  badge: string;
  skills: string[];
  completed?: boolean;
  completedAt?: Date;
}

interface LearningPathData {
  category: string;
  description: string;
  icon: string;
  color: string;
  milestones: Milestone[];
}

interface UserLearningPath {
  id: string;
  title: string;
  category: string;
  milestones: Milestone[];
  progress: number;
  completed: number;
  total: number;
  createdAt: Date;
}

export default function LearningPathsPage() {
  const { user, isLoaded } = useUser();
  const [selectedPaths, setSelectedPaths] = useState<UserLearningPath[]>([]);
  const [showSelection, setShowSelection] = useState(false);

  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem("learningPaths");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedPaths(parsed);
        setShowSelection(parsed.length === 0);
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
        setShowSelection(true);
      }
    } else {
      setShowSelection(true);
    }
  }, []);

  const loadLearningPaths = useCallback(async () => {
    if (user) {
      // Load from database via API
      try {
        const response = await fetch(`/api/learning-paths?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedPaths(data);
          setShowSelection(data.length === 0);
        } else {
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error("Error loading learning paths:", error);
        loadFromLocalStorage();
      }
    } else {
      // Not authenticated, use localStorage
      loadFromLocalStorage();
    }
  }, [user, loadFromLocalStorage]);

  // Load learning paths from localStorage or database
  useEffect(() => {
    if (isLoaded) {
      loadLearningPaths();
    }
  }, [isLoaded, loadLearningPaths]);

  const saveLearningPaths = async (paths: UserLearningPath[]) => {
    if (user) {
      // Save to database via API
      try {
        const response = await fetch("/api/learning-paths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, paths }),
        });
        if (!response.ok) {
          throw new Error("Failed to save to database");
        }
      } catch (error) {
        console.error("Error saving to database:", error);
        // Fallback to localStorage
        localStorage.setItem("learningPaths", JSON.stringify(paths));
      }
    } else {
      // Not authenticated, use localStorage
      localStorage.setItem("learningPaths", JSON.stringify(paths));
    }
  };

  const addLearningPath = (categoryData: LearningPathData) => {
    if (selectedPaths.some((path) => path.category === categoryData.category)) {
      alert("This learning path is already added!");
      return;
    }

    const now = new Date();
    const newPath: UserLearningPath = {
      id: `${categoryData.category}-${Date.now()}`,
      title: `${categoryData.icon} ${categoryData.category} Path`,
      category: categoryData.category,
      milestones: categoryData.milestones.map((milestone) => ({
        ...milestone,
        completed: false,
      })),
      progress: 0,
      completed: 0,
      total: categoryData.milestones.length,
      createdAt: now,
    };

    const updatedPaths = [...selectedPaths, newPath];
    setSelectedPaths(updatedPaths);
    saveLearningPaths(updatedPaths);
    setShowSelection(false);
  };

  const removeLearningPath = (pathId: string) => {
    if (confirm("Are you sure you want to remove this learning path?")) {
      const updatedPaths = selectedPaths.filter((path) => path.id !== pathId);
      setSelectedPaths(updatedPaths);
      saveLearningPaths(updatedPaths);
      if (updatedPaths.length === 0) {
        setShowSelection(true);
      }
    }
  };

  const toggleMilestone = async (pathId: string, milestoneIndex: number) => {
    const updatedPaths = selectedPaths.map((path) => {
      if (path.id === pathId) {
        const updatedMilestones = [...path.milestones];
        updatedMilestones[milestoneIndex] = {
          ...updatedMilestones[milestoneIndex],
          completed: !updatedMilestones[milestoneIndex].completed,
          completedAt: !updatedMilestones[milestoneIndex].completed
            ? new Date()
            : undefined,
        };

        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = (completedCount / updatedMilestones.length) * 100;

        return {
          ...path,
          milestones: updatedMilestones,
          progress,
          completed: completedCount,
        };
      }
      return path;
    });

    setSelectedPaths(updatedPaths);
    saveLearningPaths(updatedPaths);
  };

  const calculateTotalProgress = () => {
    if (selectedPaths.length === 0) return 0;
    const totalCompleted = selectedPaths.reduce(
      (sum, path) => sum + path.completed,
      0
    );
    const totalMilestones = selectedPaths.reduce(
      (sum, path) => sum + path.total,
      0
    );
    return totalMilestones > 0 ? (totalCompleted / totalMilestones) * 100 : 0;
  };

  return (
    <div className="learning-paths-container">
      <div className="paths-header">
        <div>
          <h1>My Learning Paths</h1>
          <p className="subtitle">
            Track your progress and earn badges as you complete milestones
          </p>
        </div>
        {selectedPaths.length > 0 && (
          <div className="overall-progress">
            <div className="progress-label">
              <Target className="w-5 h-5" />
              <span>Overall Progress</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${calculateTotalProgress()}%` }}
              >
                <span className="progress-text">
                  {calculateTotalProgress().toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSelection ? (
        <div className="path-selection">
          <h2>Choose Your Learning Paths</h2>
          <p className="selection-subtitle">
            Select one or more paths that match your interests and goals
          </p>
          <div className="paths-grid">
            {learningPathsData.map((path, index) => (
              <div
                key={index}
                className={`path-card path-${path.color}`}
                onClick={() => addLearningPath(path)}
              >
                <div className="path-card-header">
                  <span className="path-icon">{path.icon}</span>
                  <h3>{path.category}</h3>
                </div>
                <p className="path-description">{path.description}</p>
                <div className="path-stats">
                  <div className="stat">
                    <TrendingUp className="w-4 h-4" />
                    <span>{path.milestones.length} Milestones</span>
                  </div>
                  <div className="stat">
                    <Award className="w-4 h-4" />
                    <span>{path.milestones.length} Badges</span>
                  </div>
                </div>
                <button className="add-path-btn">
                  <Plus className="w-5 h-5" />
                  Add Path
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="actions-bar">
            <button
              className="btn-primary"
              onClick={() => setShowSelection(true)}
            >
              <Plus className="w-5 h-5" />
              Add Learning Path
            </button>
            <div className="paths-count">
              {selectedPaths.length} Active Path{selectedPaths.length !== 1 ? "s" : ""}
            </div>
          </div>

          {selectedPaths.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-icon" />
              <h3>No Learning Paths Yet</h3>
              <p>Create your first learning path to start tracking progress</p>
              <button className="btn-primary" onClick={() => setShowSelection(true)}>
                <Plus className="w-5 h-5" />
                Add Learning Path
              </button>
            </div>
          ) : (
            <div className="paths-list">
              {selectedPaths.map((path) => {
                const pathData = learningPathsData.find(
                  (p) => p.category === path.category
                );
                const colorClass = pathData?.color || "blue";

                return (
                  <div key={path.id} className={`learning-path path-${colorClass}`}>
                    <div className="path-header">
                      <div className="path-title-section">
                        <span className="path-icon">{pathData?.icon || "📚"}</span>
                        <div>
                          <h3>{path.title}</h3>
                          <p className="path-description">{pathData?.description}</p>
                        </div>
                      </div>
                      <button
                        className="remove-path-btn"
                        onClick={() => removeLearningPath(path.id)}
                        title="Remove path"
                      >
                        ×
                      </button>
                    </div>

                    <div className="progress-section">
                      <div className="progress-info">
                        <span>
                          {path.completed} of {path.total} completed
                        </span>
                        <span className="progress-percent">
                          {path.progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill path-${colorClass}-fill`}
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="milestones-list">
                      <h4>Milestones</h4>
                      {path.milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className={`milestone ${milestone.completed ? "completed" : ""}`}
                          onClick={() => toggleMilestone(path.id, index)}
                        >
                          <div className="milestone-check">
                            {milestone.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="milestone-content">
                            <div className="milestone-header">
                              <h5>{milestone.title}</h5>
                              {milestone.completed && milestone.badge && (
                                <div className="milestone-badge">
                                  <Award className="w-4 h-4" />
                                  <span>{milestone.badge}</span>
                                </div>
                              )}
                            </div>
                            <p className="milestone-description">
                              {milestone.description}
                            </p>
                            {milestone.skills.length > 0 && (
                              <div className="milestone-skills">
                                {milestone.skills.map((skill, skillIndex) => (
                                  <span key={skillIndex} className="skill-tag">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                            {milestone.completed && milestone.completedAt && (
                              <div className="completed-date">
                                Completed on{" "}
                                {new Date(milestone.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


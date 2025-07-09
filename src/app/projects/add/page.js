"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { submitProject } from "../actions";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [timeError, setTimeError] = useState("");

  function calculateTotalHours(sDate, sTime, eDate, eTime) {
    if (!sDate || !sTime || !eDate || !eTime) return 0;
    const start = new Date(`${sDate.toISOString().split('T')[0]}T${sTime}`);
    const end = new Date(`${eDate.toISOString().split('T')[0]}T${eTime}`);
    if (end <= start) return 0;
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  useEffect(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate.toISOString().split('T')[0]}T${startTime}`);
      const end = new Date(`${endDate.toISOString().split('T')[0]}T${endTime}`);
      if (end <= start) {
        setTimeError("End date/time must be after start date/time");
        setTotalHours(0);
      } else {
        setTimeError("");
        setTotalHours(calculateTotalHours(startDate, startTime, endDate, endTime));
      }
    } else {
      setTimeError("");
      setTotalHours(0);
    }
  }, [startDate, startTime, endDate, endTime]);

  if (status === "loading") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setMessage("");
    if (!startDate || !startTime || !endDate || !endTime) {
      setMessage("Please fill in all required date and time fields.");
      setIsSubmitting(false);
      return;
    }
    const start = new Date(`${startDate.toISOString().split('T')[0]}T${startTime}`);
    const end = new Date(`${endDate.toISOString().split('T')[0]}T${endTime}`);
    if (end <= start) {
      setMessage("End date/time must be after start date/time.");
      setIsSubmitting(false);
      return;
    }
    formData.set("startDate", startDate.toISOString());
    formData.set("start_time", startTime);
    formData.set("startTime", startTime);
    formData.set("endDate", endDate.toISOString());
    formData.set("end_time", endTime);
    formData.set("endTime", endTime);
    formData.set("totalHours", totalHours);
    formData.set("hours", totalHours);

    try {
      const result = await submitProject(formData);
      
      if (result.success) {
        setMessage("Project submitted successfully!");
        document.getElementById("projectForm").reset();
        setImagePreview(null);
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setMessage(result.error || "Failed to submit project. Please try again.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error("Error submitting project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="logo">Communaid</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => router.push("/")}
              >
                <span className="nav-icon">📋</span>
                <span className="nav-text">Available Projects</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => router.push("/?tab=leaderboard")}
              >
                <span className="nav-icon">🏆</span>
                <span className="nav-text">Leaderboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'certificate' ? 'active' : ''}`}
                onClick={() => router.push("/?tab=certificate")}
              >
                <span className="nav-icon">🏅</span>
                <span className="nav-text">Certificates</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Floating Toggle Button - appears when sidebar is closed */}
      {!sidebarOpen && (
        <button 
          className="floating-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          title="Open Sidebar"
        >
          ☰
        </button>
      )}

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              ☰
            </button>
            <div className="header-text">
              <h1>Add Project</h1>
              <p>Submit a new project to get help from our community volunteers</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{session.user.name}</span>
                <span className="user-email">{session.user.email}</span>
              </div>
              <button 
                onClick={() => signOut()}
                className="logout-btn"
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="dashboard-main">
          <div className="request-service-form-container">
            <form id="projectForm" action={handleSubmit} className="request-service-form">
              <div className="form-section">
                <h2>Project Details</h2>
                
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Brief summary of your project"
                    className="form-input"
                    maxLength={100}
                  />
                  <small>Maximum 100 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Detailed explanation of what you need help with"
                    className="form-textarea"
                    rows={4}
                    maxLength={500}
                  ></textarea>
                  <small>Maximum 500 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="instructions">Special Instructions</label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    placeholder="Any special requirements, preferences, or additional information"
                    className="form-textarea"
                    rows={3}
                    maxLength={300}
                  ></textarea>
                  <small>Optional - Maximum 300 characters</small>
                </div>
              </div>

              <div className="form-section">
                <h2>Schedule & Media</h2>
                
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    minDate={new Date()}
                    required
                    placeholderText="Select start date"
                    className="form-input"
                    id="startDate"
                    name="startDate"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className="form-input"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    minDate={startDate || new Date()}
                    required
                    placeholderText="Select end date"
                    className="form-input"
                    id="endDate"
                    name="endDate"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className="form-input"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Total Hours Earned</label>
                  <input
                    type="text"
                    className="form-input"
                    value={totalHours > 0 ? totalHours : ""}
                    readOnly
                    style={{ background: '#f3f4f6', color: '#1e293b', fontWeight: 600 }}
                  />
                </div>

                {timeError && <div className="error-message">{timeError}</div>}

                <div className="form-group">
                  <label htmlFor="image">Upload Image (Optional)</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    className="form-file-input"
                    onChange={handleImageChange}
                  />
                  <small>Supported formats: JPG, PNG, GIF (Max 5MB)</small>
                </div>

                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        document.getElementById("image").value = "";
                      }}
                      className="remove-image-btn"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h2>Contact Information</h2>
                
                <div className="form-group">
                  <label htmlFor="contactPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="Your phone number for contact"
                    className="form-input"
                  />
                  <small>Optional - For direct contact if needed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="urgency">Urgency Level *</label>
                  <select id="urgency" name="urgency" required className="form-select">
                    <option value="">Select urgency level</option>
                    <option value="low">Low - Can wait a few days</option>
                    <option value="medium">Medium - Within 1-2 days</option>
                    <option value="high">High - As soon as possible</option>
                    <option value="urgent">Urgent - Immediate assistance needed</option>
                  </select>
                </div>
              </div>

              {message && (
                <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  ← Back to Home
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Project"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
} 
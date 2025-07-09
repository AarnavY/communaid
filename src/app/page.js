"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';
import { useState, useEffect } from 'react';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(hour));
  date.setMinutes(Number(minute));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Modal component for project details
function ProjectDetailsModal({ project, onClose }) {
  if (!project) return null;
  console.log('Project in modal:', project);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-accent" />
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Project Details</h2>
        <div className="modal-section"><strong>Title:</strong> <span>{project.title}</span></div>
        <div className="modal-section"><strong>Description:</strong><div>{project.description}</div></div>
        <div className="modal-section"><strong>Instructions:</strong><div>{project.instructions || 'None'}</div></div>
        <div className="modal-section"><strong>Schedule:</strong><div>{project.startDate ? `${new Date(project.startDate).toLocaleDateString()} ${formatTime(project.startTime)}` : 'N/A'}<br/>to<br/>{project.endDate ? `${new Date(project.endDate).toLocaleDateString()} ${formatTime(project.endTime)}` : 'N/A'}</div></div>
        <div className="modal-section"><strong>Hours:</strong><div>{((project.hours ?? project.totalHours) || 'N/A')}</div></div>
        <div className="modal-section"><strong>Contact Phone:</strong><div>{project.contactPhone || 'Not provided'}</div></div>
        <div className="modal-section"><strong>Urgency Level:</strong><div>{project.urgency ? project.urgency.charAt(0).toUpperCase() + project.urgency.slice(1) : 'Not specified'}</div></div>
        {project.imageUrl && (
          <div className="modal-section">
            <strong>Image:</strong>
            <div><img src={project.imageUrl} alt="Project" className="modal-image" /></div>
          </div>
        )}
        <div className="modal-section"><strong>Status:</strong> <span>{project.status}</span></div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-accent" style={{ background: 'linear-gradient(90deg, #227a2b 0%, #ffb74d 100%)' }} />
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 style={{ color: '#227a2b', marginBottom: 16 }}>Delete Project?</h2>
        <div style={{ marginBottom: 24, color: '#444', fontSize: '1.05rem' }}>
          Are you sure you want to delete this project? This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ background: '#f3f4f6', color: '#227a2b', border: '1px solid #e0e0e0' }}>Cancel</button>
          <button className="btn-primary" style={{ background: '#227a2b', border: 'none' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Update getLeaderboardData to only count projects joined and hours joined
function getLeaderboardData(projects, userMap) {
  const userStats = {};
  projects.forEach(project => {
    if (Array.isArray(project.joinedVolunteers)) {
      project.joinedVolunteers.forEach(volId => {
        if (!userStats[volId]) {
          userStats[volId] = {
            name: '',
            email: '',
            projectsJoined: 0,
            hoursJoined: 0,
            badges: new Set(),
          };
        }
        userStats[volId].projectsJoined += 1;
        userStats[volId].hoursJoined += project.hours ?? project.totalHours ?? 0;
        userStats[volId].badges.add('Helper');
      });
    }
  });
  // Convert to array and fill in user info from userMap
  return Object.entries(userStats).map(([id, stats]) => {
    const user = userMap[id] || {};
    let displayName = '';
    if (user.firstName) {
      displayName = `${user.firstName} ${user.lastName || ''}`.trim();
    } else if (user.name) {
      displayName = user.name;
    } else if (user.email) {
      displayName = user.email;
    } else {
      displayName = id;
    }
    return {
      id,
      ...stats,
      name: displayName,
      email: user.email || '',
      badges: Array.from(stats.badges || []),
    };
  });
}

export default function Home() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('projects');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [joiningProjectId, setJoiningProjectId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null });
  // 1. Add state for demo mode
  const [demoMode, setDemoMode] = useState(false);
  // 1. Add state for users and fetch logic
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  // 2. Build a userMap for fast lookup
  const userMap = {};
  users.forEach(u => { userMap[u._id] = u; });

  useEffect(() => {
    if (["projects", "my-projects-created", "my-projects-joined"].includes(activeTab)) {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => setProjects(data.projects || []));
    }
  }, [activeTab]);

  // 2. Add awards data structure and state for logs
  const AWARDS = [
    {
      name: "Presidential Volunteer Service Award (Teens)",
      ageMin: 11, ageMax: 15,
      tiers: [
        { name: "Bronze", minHours: 50, maxHours: 74 },
        { name: "Silver", minHours: 75, maxHours: 99 },
        { name: "Gold", minHours: 100 }
      ]
    },
    {
      name: "Presidential Volunteer Service Award (Young Adults)",
      ageMin: 16, ageMax: 25,
      tiers: [
        { name: "Bronze", minHours: 100, maxHours: 174 },
        { name: "Silver", minHours: 175, maxHours: 249 },
        { name: "Gold", minHours: 250 }
      ]
    },
    {
      name: "Community Impact Award",
      description: "100+ hours for one cause",
      minHours: 100,
      perCause: true
    },
    {
      name: "Leadership in Service Award",
      description: "150+ hours with leadership role",
      minHours: 150,
      leadership: true
    },
    {
      name: "Team Volunteer Recognition",
      description: "200+ collective hours (group)",
      minHours: 200,
      team: true
    }
  ];
  const [hourLogs, setHourLogs] = useState([]);
  const [logForm, setLogForm] = useState({ date: '', hours: '', cause: '', leadership: false, file: null });

  if (status === "loading") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="voluntree-auth-bg">
        <div className="voluntree-auth-gradient" />
        <div className="voluntree-auth-container">
          <h1 className="voluntree-title">Communaid</h1>
          <p className="voluntree-slogan">Helping hands for those who once helped us.</p>
          <div className="voluntree-forms">
            <form className="voluntree-form" onSubmit={e => { e.preventDefault(); signIn('google'); }}>
              <h2>Login</h2>
              <button type="submit" className="voluntree-btn">Sign in with Google</button>
            </form>
            <div className="voluntree-divider">or</div>
            <div className="voluntree-form">
              <h2>Sign Up</h2>
              <Link href="/signup">
                <button className="voluntree-btn">Sign up with Communaid</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: log session user and joinedVolunteers for each project
  console.log('Session user:', session.user);
  projects.forEach(p => console.log('Project', p._id, 'joinedVolunteers:', p.joinedVolunteers));

  const handleJoinProject = async (projectId) => {
    setJoiningProjectId(projectId);
    try {
      console.log('Joining:', { projectId, userId: session.user.id });
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: session.user.id })
      });
      if (res.ok) {
        // Refetch projects to update UI
        const data = await res.json();
        fetch('/api/projects')
          .then(res => res.json())
          .then(data => setProjects(data.projects || []));
      } else {
        // Optionally show error
        alert('Failed to join project.');
      }
    } catch (err) {
      alert('Failed to join project.');
    } finally {
      setJoiningProjectId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModal.projectId) return;
    try {
      const res = await fetch(`/api/projects/${deleteModal.projectId}`, { method: 'DELETE' });
      if (res.ok) {
        fetch('/api/projects')
          .then(res => res.json())
          .then(data => setProjects(data.projects || []));
      } else {
        alert('Failed to delete project.');
      }
    } catch (err) {
      alert('Failed to delete project.');
    } finally {
      setDeleteModal({ open: false, projectId: null });
    }
  };

  // 2. Add fake leaderboard users
  function getFakeLeaderboardUsers() {
    return [
      {
        id: 'fake1',
        name: 'Alice Demo',
        email: 'alice@demo.com',
        hoursJoined: 120,
        projectsJoined: 14,
        badges: ['Gold', 'Helper'],
      },
      {
        id: 'fake2',
        name: 'Bob Example',
        email: 'bob@demo.com',
        hoursJoined: 65,
        projectsJoined: 7,
        badges: ['Silver', 'Helper'],
      },
      {
        id: 'fake3',
        name: 'Charlie Test',
        email: 'charlie@demo.com',
        hoursJoined: 35,
        projectsJoined: 3,
        badges: ['Bronze', 'Helper'],
      },
      {
        id: 'fake4',
        name: 'Dana Showcase',
        email: 'dana@demo.com',
        hoursJoined: 10,
        projectsJoined: 1,
        badges: ['Helper'],
      },
    ];
  }

  const renderTableContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Available Projects</h2>
              <button className="add-btn" onClick={() => window.location.href = '/projects/add'}>+ Add New Project</button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Description</th>
                    <th>Start Date</th>
                    <th>Start Time</th>
                    <th>End Date</th>
                    <th>End Time</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr><td colSpan="5">No projects found.</td></tr>
                  ) : (
                    projects.filter(project => {
                      // Hide if user is creator or has joined
                      const userId = session.user.id;
                      return project.userId !== userId && (!Array.isArray(project.joinedVolunteers) || !project.joinedVolunteers.includes(userId));
                    }).map(project => (
                      <tr key={project._id}>
                        <td>{project.title}</td>
                        <td>{project.description}</td>
                        <td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}</td>
                        <td>{formatTime(project.startTime) || ''}</td>
                        <td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}</td>
                        <td>{formatTime(project.endTime) || ''}</td>
                        <td>{((project.hours ?? project.totalHours) || '')}</td>
                        <td><span className={`status ${project.status}`}>{project.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="action-btn view" onClick={() => setSelectedProject(project)}>View</button>
                          <button className="action-btn join" onClick={() => handleJoinProject(project._id)} disabled={joiningProjectId === project._id}>
                            {joiningProjectId === project._id ? 'Joining...' : 'Join'}
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
          </div>
        );
      case 'my-projects-created': {
        const createdProjects = projects.filter(p => p.userId === session.user.id);
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Created Projects</h2>
            </div>
            <div className="my-projects-flex">
              <section className="my-projects-card" style={{width: '100%'}}>
                <h3 className="my-projects-title">Projects I Created</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>Start Time</th>
                        <th>End Date</th>
                        <th>End Time</th>
                        <th>Hours</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdProjects.length === 0 ? (
                        <tr><td colSpan="6">No projects created by you.</td></tr>
                      ) : (
                        createdProjects.map(project => (
                          <tr key={project._id}>
                            <td>{project.title}</td>
                            <td>{project.description}</td>
                            <td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}</td>
                            <td>{formatTime(project.startTime) || ''}</td>
                            <td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}</td>
                            <td>{formatTime(project.endTime) || ''}</td>
                            <td>{((project.hours ?? project.totalHours) || '')}</td>
                            <td><span className={`status ${project.status}`}>{project.status}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn view" onClick={() => setSelectedProject(project)}>View</button>
                                <button className="action-btn delete" onClick={() => setDeleteModal({ open: true, projectId: project._id })}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
          </div>
        );
      }
      case 'my-projects-joined': {
        const joinedProjects = projects.filter(p => Array.isArray(p.joinedVolunteers) && p.joinedVolunteers.includes(session.user.id) && p.userId !== session.user.id);
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Joined Projects</h2>
            </div>
            <div className="my-projects-flex">
              <section className="my-projects-card" style={{width: '100%'}}>
                <h3 className="my-projects-title">Projects I Joined</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>Start Time</th>
                        <th>End Date</th>
                        <th>End Time</th>
                        <th>Hours</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {joinedProjects.length === 0 ? (
                        <tr><td colSpan="6">No projects joined by you.</td></tr>
                      ) : (
                        joinedProjects.map(project => (
                          <tr key={project._id}>
                            <td>{project.title}</td>
                            <td>{project.description}</td>
                            <td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}</td>
                            <td>{formatTime(project.startTime) || ''}</td>
                            <td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}</td>
                            <td>{formatTime(project.endTime) || ''}</td>
                            <td>{((project.hours ?? project.totalHours) || '')}</td>
                            <td><span className={`status ${project.status}`}>{project.status}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn view" onClick={() => setSelectedProject(project)}>View</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
          </div>
        );
      }
      case 'leaderboard': {
        let leaderboard = getLeaderboardData(projects, userMap);
        if (demoMode) {
          leaderboard = [...leaderboard, ...getFakeLeaderboardUsers()];
        }
        leaderboard.sort((a, b) => {
          if (b.projectsJoined !== a.projectsJoined) {
            return b.projectsJoined - a.projectsJoined;
          }
          return b.hoursJoined - a.hoursJoined;
        });
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Volunteer Leaderboard</h2>
              <div className="leaderboard-stats">
                <span>Total Volunteers: {leaderboard.length}</span>
                <span>
                  Hours Contributed: {leaderboard.reduce((sum, u) => sum + u.hoursJoined, 0)}
                </span>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Volunteer</th>
                    <th>Projects Joined</th>
                    <th>Hours Joined</th>
                    <th>Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, idx) => (
                    <tr key={user.id} className={idx < 3 ? 'top-rank' : ''}>
                      <td>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                      <td>{user.name || user.email || user.id}</td>
                      <td>{user.projectsJoined}</td>
                      <td>{user.hoursJoined}</td>
                      <td>
                        {user.badges.map(badge => (
                          <span key={badge} className={`badge ${badge.toLowerCase()}`}>{badge}</span>
                        ))}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case 'request':
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Service Requests</h2>
              <button className="add-btn">+ New Request</button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Service Type</th>
                    <th>Requester</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#REQ-001</td>
                    <td>Home Care</td>
                    <td>Margaret Smith</td>
                    <td><span className="priority high">High</span></td>
                    <td><span className="status pending">Pending</span></td>
                    <td>2024-01-15</td>
                    <td>
                      <button className="action-btn view">View</button>
                      <button className="action-btn accept">Accept</button>
                    </td>
                  </tr>
                  <tr>
                    <td>#REQ-002</td>
                    <td>Transportation</td>
                    <td>Robert Wilson</td>
                    <td><span className="priority medium">Medium</span></td>
                    <td><span className="status active">In Progress</span></td>
                    <td>2024-01-14</td>
                    <td>
                      <button className="action-btn view">View</button>
                      <button className="action-btn update">Update</button>
                    </td>
                  </tr>
                  <tr>
                    <td>#REQ-003</td>
                    <td>Grocery Shopping</td>
                    <td>Helen Davis</td>
                    <td><span className="priority low">Low</span></td>
                    <td><span className="status completed">Completed</span></td>
                    <td>2024-01-13</td>
                    <td>
                      <button className="action-btn view">View</button>
                      <button className="action-btn review">Review</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'awards': {
        // Demo: calculate total hours, per cause, leadership, etc. from hourLogs
        const totalHours = hourLogs.reduce((sum, l) => sum + Number(l.hours || 0), 0);
        const causeHours = {};
        hourLogs.forEach(l => { if (l.cause) causeHours[l.cause] = (causeHours[l.cause] || 0) + Number(l.hours || 0); });
        const leadershipHours = hourLogs.filter(l => l.leadership).reduce((sum, l) => sum + Number(l.hours || 0), 0);
        // UI
        return (
          <div className="awards-container" style={{ color: '#111' }}>
            <h2 style={{ color: '#111' }}>Volunteering Awards</h2>
            {AWARDS.map(award => (
              <div className="award-card" key={award.name} style={{ marginBottom: 32, border: '1px solid #e0e0e0', borderRadius: 12, padding: 24, color: '#111' }}>
                <h3 style={{ color: '#111' }}>{award.name}</h3>
                {award.description && <p style={{ color: '#111' }}>{award.description}</p>}
                {/* Eligibility */}
                {award.tiers ? (
                  <ul style={{ marginBottom: 8 }}>
                    {award.tiers.map(tier => (
                      <li key={tier.name}>
                        <b>{tier.name}:</b> {tier.minHours}+
                        {tier.maxHours ? `–${tier.maxHours}` : ''} hours
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    <b>Criteria:</b> {award.minHours}+ hours{award.leadership ? ' (leadership)' : ''}{award.perCause ? ' (one cause)' : ''}{award.team ? ' (team)' : ''}
                  </div>
                )}
                {/* Progress bar */}
                <div style={{ margin: '12px 0', width: 320, maxWidth: '100%' }}>
                  {award.tiers ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {award.tiers.map(tier => {
                        let achieved = false;
                        let progress = 0;
                        if (award.ageMin && award.ageMax && session.user.dateOfBirth) {
                          const birthYear = new Date(session.user.dateOfBirth).getFullYear();
                          const age = new Date().getFullYear() - birthYear;
                          if (age < award.ageMin || age > award.ageMax) return null;
                        }
                        if (totalHours >= tier.minHours && (!tier.maxHours || totalHours <= tier.maxHours)) achieved = true;
                        progress = Math.min(100, (totalHours / (tier.maxHours || tier.minHours)) * 100);
                        return (
                          <div key={tier.name} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: 12, background: achieved ? '#38b000' : '#e0e0e0', borderRadius: 6, marginBottom: 4 }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: achieved ? '#38b000' : '#ffb74d', borderRadius: 6 }} />
                            </div>
                            <span style={{ fontSize: 12 }}>{tier.name}</span>
                            {achieved && <span style={{ marginLeft: 4, color: '#38b000' }}>✔️</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ height: 12, background: totalHours >= award.minHours ? '#38b000' : '#e0e0e0', borderRadius: 6, marginBottom: 4, width: '100%' }}>
                      <div style={{ width: `${Math.min(100, (totalHours / award.minHours) * 100)}%`, height: '100%', background: totalHours >= award.minHours ? '#38b000' : '#ffb74d', borderRadius: 6 }} />
                    </div>
                  )}
                </div>
                {/* Badge or certificate (demo) */}
                {(award.tiers && award.tiers.some(tier => totalHours >= tier.minHours && (!tier.maxHours || totalHours <= tier.maxHours))) || (!award.tiers && totalHours >= award.minHours) ? (
                  <div style={{ marginTop: 8, color: '#38b000', fontWeight: 600 }}>🏅 Eligible!</div>
                ) : null}
              </div>
            ))}
            {/* Hour logging form */}
            <div className="award-card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 24, marginTop: 32, color: '#111' }}>
              <h3 style={{ color: '#111' }}>Log Volunteer Hours</h3>
              <form onSubmit={e => {
                e.preventDefault();
                setHourLogs(logs => [...logs, logForm]);
                setLogForm({ date: '', hours: '', cause: '', leadership: false, file: null });
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <label>Date<br /><input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} required /></label>
                  </div>
                  <div>
                    <label>Hours<br /><input type="number" min="1" value={logForm.hours} onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))} required /></label>
                  </div>
                  <div>
                    <label>Cause<br /><input type="text" value={logForm.cause} onChange={e => setLogForm(f => ({ ...f, cause: e.target.value }))} required /></label>
                  </div>
                  <div style={{ alignSelf: 'end' }}>
                    <label><input type="checkbox" checked={logForm.leadership} onChange={e => setLogForm(f => ({ ...f, leadership: e.target.checked }))} /> Leadership Role</label>
                  </div>
                  <div>
                    <label>Supporting Document<br /><input type="file" onChange={e => setLogForm(f => ({ ...f, file: e.target.files[0] }))} /></label>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: 16 }}>Log Hours</button>
              </form>
              {/* Show logged hours (demo) */}
              <div style={{ marginTop: 24 }}>
                <h4>My Logged Hours</h4>
                <ul>
                  {hourLogs.map((log, i) => (
                    <li key={i}>{log.date} — {log.hours}h — {log.cause} {log.leadership ? '(Leadership)' : ''} {log.file ? `📎 ${log.file.name}` : ''}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }
      case 'demo':
        return (
          <div className="table-container">
            <div className="table-header">
              <h2>Demo Mode</h2>
            </div>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>
                Demo mode adds fake people to the leaderboard so you can see all its features.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => setDemoMode(demo => !demo)}
              >
                {demoMode ? 'Turn OFF Demo Mode' : 'Turn ON Demo Mode'}
              </button>
              <div style={{ marginTop: 24, color: demoMode ? '#227a2b' : '#991b1b', fontWeight: 600 }}>
                Demo Mode is <b>{demoMode ? 'ON' : 'OFF'}</b>
              </div>
            </div>
          </div>
        );
      default:
        return null;
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
                onClick={() => setActiveTab('projects')}
              >
                <span className="nav-icon">📋</span>
                <span className="nav-text">Available Projects</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'my-projects-created' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-projects-created')}
              >
                <span className="nav-icon">🗂️</span>
                <span className="nav-text">Created Projects</span>
              </button>
                </li>
                <li>
              <button
                className={`nav-item ${activeTab === 'my-projects-joined' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-projects-joined')}
              >
                <span className="nav-icon">🤝</span>
                <span className="nav-text">Joined Projects</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                <span className="nav-icon">🏆</span>
                <span className="nav-text">Leaderboard</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'awards' ? 'active' : ''}`}
                onClick={() => setActiveTab('awards')}
              >
                <span className="nav-icon">🎖️</span>
                <span className="nav-text">Volunteering Awards</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                <span className="nav-icon">🧪</span>
                <span className="nav-text">Demo Mode</span>
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
              <h1>Dashboard</h1>
              <p>Welcome back, {session.user.name}!</p>
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
          {renderTableContent()}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, projectId: null })}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
} 
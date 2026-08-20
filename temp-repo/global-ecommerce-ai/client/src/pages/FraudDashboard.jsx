import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const API = "http://localhost:5000/api/fraud";

const FraudDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  const [analytics, setAnalytics] = useState(null);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [filter, setFilter] = useState({ status: "", severity: "" });
  const [reviewForm, setReviewForm] = useState({ id: null, status: "", actionTaken: "", reviewNotes: "" });

  useEffect(() => {
    fetchAnalytics();
    fetchLogs();
  }, [filter]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(`${API}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.severity) params.severity = filter.severity;

      const { data } = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setFraudLogs(data.fraudLogs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async () => {
    try {
      await axios.put(
        `${API}/${reviewForm.id}/review`,
        {
          status: reviewForm.status,
          actionTaken: reviewForm.actionTaken,
          reviewNotes: reviewForm.reviewNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewForm({ id: null, status: "", actionTaken: "", reviewNotes: "" });
      fetchLogs();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Review failed");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "#dc2626";
      case "high": return "#ea580c";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "#f59e0b",
      reviewed: "#3b82f6",
      resolved: "#10b981",
      false_positive: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px" }}>🛡️ Fraud Detection Dashboard</h1>

      {/* Analytics Cards */}
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Flags", value: analytics.totalFlags, color: "#ef4444", icon: "🚩" },
            { label: "Pending", value: analytics.pending, color: "#f59e0b", icon: "⏳" },
            { label: "Reviewed", value: analytics.reviewed, color: "#3b82f6", icon: "👁" },
            { label: "Resolved", value: analytics.resolved, color: "#10b981", icon: "✅" },
            { label: "False Positives", value: analytics.falsePositives, color: "#6b7280", icon: "❌" },
            { label: "Avg Risk Score", value: analytics.averageRiskScore, color: "#8b5cf6", icon: "📊" },
          ].map((card, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderTop: `3px solid ${card.color}` }}>
              <p style={{ fontSize: "24px", marginBottom: "4px" }}>{card.icon}</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: card.color }}>{card.value}</p>
              <p style={{ fontSize: "13px", color: "#6b7280" }}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fraud Type Distribution */}
      {analytics?.byType && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "12px" }}>Fraud Type Distribution</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {analytics.byType.map((item, i) => (
              <span key={i} style={{ background: "#fef2f2", color: "#dc2626", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                {item._id}: {item.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False Positive</option>
        </select>
        <select value={filter.severity} onChange={(e) => setFilter({ ...filter, severity: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}>
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Fraud Logs Table */}
      <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>User</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Severity</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Risk</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Date</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#6b7280" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {fraudLogs.map((log) => (
              <tr key={log._id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 16px", fontSize: "14px" }}>{log.user?.name || "Unknown"}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>{log.type}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: getSeverityColor(log.severity), color: "#fff", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                    {log.severity}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: "600" }}>{log.riskScore}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ color: getStatusBadge(log.status), fontWeight: "600", fontSize: "13px" }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}>
                  {new Date(log.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {log.status === "pending" && (
                    <button
                      onClick={() => setReviewForm({ id: log._id, status: "reviewed", actionTaken: "flagged", reviewNotes: "" })}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fraudLogs.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No fraud logs found</p>
        )}
      </div>

      {/* Review Modal */}
      {reviewForm.id && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "400px" }}>
            <h3 style={{ fontWeight: "bold", marginBottom: "16px" }}>Review Fraud Flag</h3>
            <select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
            <select value={reviewForm.actionTaken} onChange={(e) => setReviewForm({ ...reviewForm, actionTaken: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}>
              <option value="none">No Action</option>
              <option value="flagged">Flag Account</option>
              <option value="blocked">Block Transaction</option>
              <option value="refunded">Refund</option>
              <option value="account_suspended">Suspend Account</option>
            </select>
            <textarea placeholder="Review Notes..." value={reviewForm.reviewNotes} onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", minHeight: "80px", marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleReview} style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Submit</button>
              <button onClick={() => setReviewForm({ id: null, status: "", actionTaken: "", reviewNotes: "" })} style={{ flex: 1, background: "#e5e7eb", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDashboard;

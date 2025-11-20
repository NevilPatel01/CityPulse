import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, FileText, Activity } from 'lucide-react';
import {
  getDashboardStats,
  getContentReports,
  updateReportStatus,
  removeContent,
  getReportedUsers,
  getModeratorActions
} from '../services/moderationService';
import type {
  DashboardStats,
  ContentReport,
  ReportedUser,
  ModeratorAction
} from '../services/moderationService';

const ModeratorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'actions'>('reports');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
  const [actions, setActions] = useState<ModeratorAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterContentType, setFilterContentType] = useState('all');
  const [page] = useState(1);

  const loadDashboardStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getContentReports(page, 20, filterStatus, filterContentType) as { data: { reports: ContentReport[] } };
      setReports(response.data.reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterContentType]);

  const loadReportedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReportedUsers(page, 20) as { data: ReportedUser[] };
      setReportedUsers(response.data);
    } catch (error) {
      console.error('Failed to load reported users:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getModeratorActions(page, 50) as { data: { actions: ModeratorAction[] } };
      setActions(response.data.actions);
    } catch (error) {
      console.error('Failed to load actions:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else if (activeTab === 'users') {
      loadReportedUsers();
    } else if (activeTab === 'actions') {
      loadActions();
    }
  }, [activeTab, filterStatus, filterContentType, page, loadReports, loadReportedUsers, loadActions]);

  const handleUpdateReportStatus = async (reportId: number, status: string) => {
    try {
      await updateReportStatus(reportId, status);
      loadReports();
      loadDashboardStats();
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report status');
    }
  };

  const handleRemoveContent = async (report: ContentReport) => {
    const reason = prompt('Enter reason for content removal:');
    if (!reason) return;

    if (!confirm(`Are you sure you want to remove this ${report.reported_content_type}?`)) {
      return;
    }

    try {
      await removeContent(report.reported_content_type, report.reported_content_id, reason, true);
      await updateReportStatus(report.id, 'resolved');
      loadReports();
      loadDashboardStats();
      alert('Content removed successfully');
    } catch (error) {
      console.error('Failed to remove content:', error);
      alert('Failed to remove content');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      under_review: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
      dismissed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getAccountStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border border-green-500/30',
      suspended: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      banned: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-semibold rounded uppercase">
                  MOD
                </span>
                <h1 className="text-2xl font-bold text-primary">Moderator Tools</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface border border-subtle rounded-lg p-4">
              <p className="text-muted text-sm mb-1">Pending Reports</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending_reports}</p>
            </div>
            <div className="bg-surface border border-subtle rounded-lg p-4">
              <p className="text-muted text-sm mb-1">Under Review</p>
              <p className="text-2xl font-bold text-blue-400">{stats.under_review_reports}</p>
            </div>
            <div className="bg-surface border border-subtle rounded-lg p-4">
              <p className="text-muted text-sm mb-1">Active Warnings</p>
              <p className="text-2xl font-bold text-orange-400">{stats.active_warnings}</p>
            </div>
            <div className="bg-surface border border-subtle rounded-lg p-4">
              <p className="text-muted text-sm mb-1">Banned Users</p>
              <p className="text-2xl font-bold text-red-400">{stats.banned_users}</p>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('reports')}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg p-6 text-left transition-all"
          >
            <FileText className="w-6 h-6 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-primary mb-1">Review Reports</h3>
            <p className="text-muted text-sm">Manage content reports</p>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg p-6 text-left transition-all"
          >
            <Users className="w-6 h-6 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-primary mb-1">User Management</h3>
            <p className="text-muted text-sm">Handle user violations</p>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg p-6 text-left transition-all"
          >
            <Activity className="w-6 h-6 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-primary mb-1">Achievement Management</h3>
            <p className="text-muted text-sm">View moderation history</p>
          </button>
        </div>

        {/* Active Tab Content Card */}
        <div className="bg-surface border border-subtle rounded-lg">
          <div className="border-b border-subtle p-6">
            <h2 className="text-xl font-bold text-primary">
              {activeTab === 'reports' && 'Pending Reports'}
              {activeTab === 'users' && 'Reported Users'} 
              {activeTab === 'actions' && 'Action Log'}
            </h2>
          </div>

          {/* Content Reports Tab */}
          {activeTab === 'reports' && (
            <div className="p-6 space-y-4">
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <select
                  value={filterContentType}
                  onChange={(e) => setFilterContentType(e.target.value)}
                  className="px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                >
                  <option value="all">All Types</option>
                  <option value="recommendation">Recommendations</option>
                  <option value="profile">Profiles</option>
                  <option value="trip">Trips</option>
                  <option value="comment">Comments</option>
                </select>
              </div>

              {/* Reports Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-subtle rounded-lg p-4 hover:bg-surface-glass/50">
                        {/* Report Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-primary">
                                Reported by @{report.reporter_username}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(report.status)}`}>
                                {report.status.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                report.reported_content_type === 'recommendation' ? 'bg-pink-500/20 text-pink-400' :
                                report.reported_content_type === 'profile' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {report.reported_content_type}
                              </span>
                            </div>
                            <p className="text-xs text-muted">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'under_review')}
                                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded border border-blue-500/30 transition-colors"
                                  title="Review"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => handleRemoveContent(report)}
                                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
                                  title="Remove"
                                >
                                  Remove
                                </button>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                  className="px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-sm rounded border border-gray-500/30 transition-colors"
                                  title="Dismiss"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                            {report.status === 'under_review' && (
                              <>
                                <button
                                  onClick={() => handleRemoveContent(report)}
                                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
                                >
                                  Remove Content
                                </button>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                  className="px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-sm rounded border border-gray-500/30 transition-colors"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Report Reason */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-red-400 mb-1">Report Reason:</p>
                          <p className="text-sm text-red-300">{report.report_reason}</p>
                          {report.description && (
                            <p className="text-xs text-red-300 mt-1 italic">{report.description}</p>
                          )}
                        </div>

                        {/* Reported Content */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-400 mb-2">Reported Content:</p>
                          <div className="flex gap-3">
                            {/* Content Image */}
                            {report.content_image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={report.content_image}
                                  alt="Content preview"
                                  className="w-24 h-24 object-cover rounded border border-subtle"
                                />
                              </div>
                            )}
                            {/* Content Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-primary mb-1">
                                {report.content_title}
                              </p>
                              {report.content_description && (
                                <p className="text-sm text-muted line-clamp-3">
                                  {report.content_description}
                                </p>
                              )}
                              {!report.content_description && (
                                <p className="text-xs text-muted italic">No description available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reported Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
                </div>
              ) : reportedUsers.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reported users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportedUsers.map((user) => (
                    <div key={user.id} className="border border-subtle rounded-lg p-4 hover:bg-surface-glass/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.profile_photo_url || '/default-avatar.png'}
                            alt={user.username}
                            className="w-12 h-12 rounded-full border border-subtle"
                          />
                          <div>
                            <h3 className="font-semibold text-primary">{user.username}</h3>
                            <p className="text-sm text-muted">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getAccountStatusBadge(user.account_status)}`}>
                                {user.account_status.toUpperCase()}
                              </span>
                              <span className="text-xs text-muted">
                                {user.active_warnings} warnings • {user.report_count} reports
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.location.href = `/profile/${user.username}`}
                          className="px-4 py-2 text-sm bg-pulse text-white rounded hover:bg-pulse/80 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Log Tab */}
          {activeTab === 'actions' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
                </div>
              ) : actions.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No actions logged</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="border-l-4 border-amber-500 bg-surface-glass/30 p-4 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-primary capitalize">
                              {action.action_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-muted">•</span>
                            <span className="text-xs text-muted capitalize">{action.target_type}</span>
                          </div>
                          <p className="text-sm text-muted mb-1">{action.reason}</p>
                          {action.notes && (
                            <p className="text-xs text-muted italic">{action.notes}</p>
                          )}
                          <p className="text-xs text-muted mt-2">
                            By {action.moderator_username} • {new Date(action.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;

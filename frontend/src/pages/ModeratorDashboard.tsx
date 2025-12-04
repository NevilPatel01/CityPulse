import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, FileText, Activity, ArrowLeft, ExternalLink, 
  Trash2, AlertTriangle, Ban, UserX, CheckCircle2, FileCheck, 
  Clock, User, Filter, Calendar, X, RotateCcw, Hash, Info
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import {
  getDashboardStats,
  getContentReports,
  updateReportStatus,
  removeContent,
  getReportedUsers,
  getModeratorActions,
  issueWarning,
  suspendUser,
  banUser,
  reinstateUser
} from '../services/moderationService';
import type {
  DashboardStats,
  ContentReport,
  ReportedUser,
  ModeratorAction
} from '../services/moderationService';

const ModeratorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'actions'>('reports');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
  const [actions, setActions] = useState<ModeratorAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterContentType, setFilterContentType] = useState('all');
  const [actionFilter, setActionFilter] = useState('all'); // For action history filtering
  const [page] = useState(1);
  
  // User action modals state
  const [selectedUser, setSelectedUser] = useState<ReportedUser | null>(null);
  const [actionModalType, setActionModalType] = useState<'warn' | 'suspend' | 'ban' | 'reinstate' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to get redirect URL based on content type
  const getContentUrl = (report: ContentReport) => {
    switch (report.reported_content_type) {
      case 'recommendation':
        return `/recommendations/${report.reported_content_id}`;
      case 'trip':
        return `/trips/${report.reported_content_id}`;
      case 'profile':
        // Use username for profile links instead of ID
        return report.content_owner_username ? `/profile/${report.content_owner_username}` : null;
      default:
        return null;
    }
  };

  // Helper function to get full image URL
  const getFullImageUrl = (imageUrl: string | null | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  };

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
      // Don't load profile reports in Review Reports tab - they belong in User Management
      const contentTypeFilter = filterContentType === 'profile' ? 'all' : filterContentType;
      const response = await getContentReports(page, 20, filterStatus, contentTypeFilter) as { data: { reports: ContentReport[] } };
      // Filter out profile reports - they should only appear in User Management tab
      const filteredReports = response.data.reports.filter(report => report.reported_content_type !== 'profile');
      setReports(filteredReports);
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
    // Reset profile filter if set when viewing reports tab (profiles only in User Management)
    if (activeTab === 'reports' && filterContentType === 'profile') {
      setFilterContentType('all');
    }
  }, [activeTab, filterContentType]);

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
    } catch (error: unknown) {
      console.error('Failed to remove content:', error);
      const errorMessage = (error as { message?: string; error?: string })?.message || (error as { message?: string; error?: string })?.error || 'Failed to remove content';
      alert(errorMessage);
      // If content already removed or not found, refresh reports to filter it out
      if (errorMessage.includes('already been') || errorMessage.includes('not found')) {
        loadReports();
      }
    }
  };

  // User action handlers
  const handleOpenActionModal = (user: ReportedUser, actionType: 'warn' | 'suspend' | 'ban' | 'reinstate') => {
    setSelectedUser(user);
    setActionModalType(actionType);
  };

  const handleCloseActionModal = () => {
    setSelectedUser(null);
    setActionModalType(null);
  };

  const handleIssueWarning = async (warningType: string, message: string, severity: 'low' | 'medium' | 'high') => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      await issueWarning(selectedUser.id, warningType, message, severity);
      alert('Warning issued successfully');
      handleCloseActionModal();
      loadReportedUsers();
      loadDashboardStats();
    } catch (error: unknown) {
      console.error('Failed to issue warning:', error);
      alert((error as { message?: string; error?: string })?.message || (error as { message?: string; error?: string })?.error || 'Failed to issue warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (reason: string, days: number) => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      await suspendUser(selectedUser.id, reason, days);
      alert('User suspended successfully');
      handleCloseActionModal();
      loadReportedUsers();
      loadDashboardStats();
    } catch (error: unknown) {
      console.error('Failed to suspend user:', error);
      alert((error as { message?: string; error?: string })?.message || (error as { message?: string; error?: string })?.error || 'Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!selectedUser) return;
    
    if (!confirm(`Are you sure you want to permanently ban ${selectedUser.username}? This action cannot be undone easily.`)) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await banUser(selectedUser.id, reason);
      alert('User banned successfully');
      handleCloseActionModal();
      loadReportedUsers();
      loadDashboardStats();
    } catch (error: unknown) {
      console.error('Failed to ban user:', error);
      alert((error as { message?: string; error?: string })?.message || (error as { message?: string; error?: string })?.error || 'Failed to ban user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReinstateUser = async (reason?: string) => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      await reinstateUser(selectedUser.id, reason);
      alert('User reinstated successfully');
      handleCloseActionModal();
      loadReportedUsers();
      loadDashboardStats();
    } catch (error: unknown) {
      console.error('Failed to reinstate user:', error);
      alert((error as { message?: string; error?: string })?.message || (error as { message?: string; error?: string })?.error || 'Failed to reinstate user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/25',
      under_review: 'bg-blue-500/15 text-blue-500 border border-blue-500/25',
      resolved: 'bg-green-500/15 text-green-500 border border-green-500/25',
      dismissed: 'bg-gray-600/20 text-gray-300 border border-gray-600/30'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getAccountStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/15 text-green-500 border border-green-500/25',
      suspended: 'bg-orange-500/15 text-orange-500 border border-orange-500/25',
      banned: 'bg-red-500/15 text-red-500 border border-red-500/25'
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  // Group actions by date
  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ModeratorAction[] } = {};
    const filtered = actionFilter === 'all' 
      ? actions 
      : actions.filter(a => a.action_type === actionFilter);

    filtered.forEach(action => {
      const date = new Date(action.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(action);
    });

    return groups;
  }, [actions, actionFilter]);

  // Get action icon and color
  const getActionIcon = (actionType: string) => {
    const iconClass = "w-5 h-5";
    switch (actionType) {
      case 'content_removal':
        return <Trash2 className={`${iconClass} text-red-500`} />;
      case 'report_status_update':
        return <FileCheck className={`${iconClass} text-blue-500`} />;
      case 'warning_issued':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'user_suspension':
        return <UserX className={`${iconClass} text-orange-500`} />;
      case 'user_ban':
        return <Ban className={`${iconClass} text-red-600`} />;
      case 'user_reinstatement':
        return <CheckCircle2 className={`${iconClass} text-green-500`} />;
      default:
        return <Activity className={`${iconClass} text-pulse`} />;
    }
  };

  // Get relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Get full formatted date and time
  const getFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      iso: date.toISOString(),
      timestamp: date.getTime()
    };
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'content_removal':
        return 'border-red-500/50 bg-red-500/5';
      case 'report_status_update':
        return 'border-blue-500/50 bg-blue-500/5';
      case 'warning_issued':
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 'user_suspension':
        return 'border-orange-500/50 bg-orange-500/5';
      case 'user_ban':
        return 'border-red-600/50 bg-red-600/5';
      case 'user_reinstatement':
        return 'border-green-500/50 bg-green-500/5';
      default:
        return 'border-pulse/50 bg-pulse/5';
    }
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/explore')}
              className="p-2 hover:bg-surface-glass rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div className="bg-pulse/20 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-pulse" />
            </div>
            <div>
              <div className="flex  items-center gap-2">
                <h1 className="text-2xl font-bold text-primary">Moderator Tools</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-muted text-sm mb-1">Pending Reports</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending_reports}</p>
            </div>
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-muted text-sm mb-1">Under Review</p>
              <p className="text-2xl font-bold text-blue-500">{stats.under_review_reports}</p>
            </div>
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-muted text-sm mb-1">Active Warnings</p>
              <p className="text-2xl font-bold text-orange-500">{stats.active_warnings}</p>
            </div>
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-muted text-sm mb-1">Banned Users</p>
              <p className="text-2xl font-bold text-red-500">{stats.banned_users}</p>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`bg-surface-glass backdrop-blur-glass border rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl ${
              activeTab === 'reports' 
                ? 'border-pulse/50 bg-pulse/10' 
                : 'border-subtle hover:border-pulse/30'
            }`}
          >
            <FileText className={`w-6 h-6 mb-3 ${activeTab === 'reports' ? 'text-pulse' : 'text-muted'}`} />
            <h3 className="text-lg font-semibold text-primary mb-1">Review Reports</h3>
            <p className="text-muted text-sm">Manage content reports</p>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`bg-surface-glass backdrop-blur-glass border rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl ${
              activeTab === 'users' 
                ? 'border-pulse/50 bg-pulse/10' 
                : 'border-subtle hover:border-pulse/30'
            }`}
          >
            <Users className={`w-6 h-6 mb-3 ${activeTab === 'users' ? 'text-pulse' : 'text-muted'}`} />
            <h3 className="text-lg font-semibold text-primary mb-1">User Management</h3>
            <p className="text-muted text-sm">Handle user violations</p>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`bg-surface-glass backdrop-blur-glass border rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl ${
              activeTab === 'actions' 
                ? 'border-pulse/50 bg-pulse/10' 
                : 'border-subtle hover:border-pulse/30'
            }`}
          >
            <Activity className={`w-6 h-6 mb-3 ${activeTab === 'actions' ? 'text-pulse' : 'text-muted'}`} />
            <h3 className="text-lg font-semibold text-primary mb-1">Action History</h3>
            <p className="text-muted text-sm">View moderation history</p>
          </button>
        </div>

        {/* Active Tab Content Card */}
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl shadow-lg">
          <div className="border-b border-subtle/30 p-6">
            <h2 className="text-xl font-bold text-primary">
              {activeTab === 'reports' && 'Content Reports'}
              {activeTab === 'users' && 'Reported Users'} 
              {activeTab === 'actions' && 'Action History'}
            </h2>
          </div>

          {/* Content Reports Tab */}
          {activeTab === 'reports' && (
            <div className="p-6 space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  <Filter className="w-4 h-4 text-muted" />
                  <span className="text-sm text-gray-300">Filters:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-base border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-pulse transition-all"
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
                    className="px-4 py-2 bg-base border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-pulse transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="recommendation">Recommendations</option>
                  <option value="trip">Trips</option>
                  <option value="comment">Comments</option>
                </select>
                </div>
                <div className="text-sm text-gray-400 px-3 py-1.5 bg-surface-glass rounded-lg border border-subtle">
                  Showing {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                </div>
              </div>

              {/* Reports Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                    {reports.map((report) => (
                    <div key={report.id} className="border border-subtle rounded-xl p-4 hover:bg-surface-glass/70 transition-all shadow-lg hover:shadow-xl flex flex-col">
                        {/* Report Header */}
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-1 h-8 rounded-full ${
                                  report.status === 'pending' ? 'bg-yellow-500' :
                                  report.status === 'under_review' ? 'bg-blue-500' :
                                  report.status === 'resolved' ? 'bg-green-500' :
                                  'bg-gray-500'
                                }`}></div>
                          <div className="flex-1">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <User className="w-3.5 h-3.5 text-muted" />
                                    <span className="text-xs font-semibold text-primary truncate">
                                      @{report.reporter_username}
                                    </span>
                                    {report.content_owner_username && (
                                      <>
                                        <span className="text-xs text-gray-300">•</span>
                                        <span className="text-xs text-gray-300 truncate">
                                          Content by @{report.content_owner_username}
                              </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                    <Clock className="w-3 h-3 text-muted" />
                                    <p className="text-xs text-gray-300">
                                      {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                                      {report.status.replace('_', ' ').toUpperCase()}
                              </span>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                      report.reported_content_type === 'recommendation' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                                      report.reported_content_type === 'profile' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {report.reported_content_type}
                              </span>
                            </div>
                                </div>
                              </div>
                          </div>
                            <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'under_review')}
                                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg hover:shadow-blue-500/20"
                                  title="Mark as Under Review"
                                >
                                  <FileCheck className="w-3 h-3" />
                                  Review
                                </button>
                                <button
                                  onClick={() => handleRemoveContent(report)}
                                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/20"
                                  title="Remove Content"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                  className="px-2.5 py-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 text-xs rounded-lg border border-gray-600/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg"
                                  title="Dismiss Report"
                                >
                                  <X className="w-3 h-3" />
                                  Dismiss
                                </button>
                              </>
                            )}
                            {report.status === 'under_review' && (
                              <>
                                <button
                                  onClick={() => handleRemoveContent(report)}
                                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/20"
                                  title="Remove Content"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                                <button
                                  onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                  className="px-2.5 py-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 text-xs rounded-lg border border-gray-600/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg"
                                  title="Dismiss Report"
                                >
                                  <X className="w-3 h-3" />
                                  Dismiss
                                </button>
                              </>
                            )}
                            {(report.status === 'resolved' || report.status === 'dismissed') && (
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to reopen this report for review?')) {
                                    handleUpdateReportStatus(report.id, 'pending');
                                  }
                                }}
                                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-lg hover:shadow-blue-500/20"
                                title="Reopen Report for Review"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reopen
                              </button>
                            )}
                            </div>
                          </div>
                        </div>

                        {/* Report Reason */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 mb-2.5">
                          <p className="text-xs font-semibold text-red-400 mb-1">Report Reason:</p>
                          <p className="text-xs text-red-300 capitalize">{report.report_reason}</p>
                          {report.description && (
                                <p className="text-xs text-red-300/90 mt-1 italic line-clamp-2">
                                  {report.description}
                                </p>
                          )}
                        </div>

                        {/* Reported Content - Clickable */}
                        <div 
                          className="bg-surface-glass/50 border border-subtle/30 rounded-lg p-2.5 cursor-pointer hover:bg-surface-glass/70 transition-colors group flex-1 flex flex-col"
                          onClick={() => {
                            const url = getContentUrl(report);
                            if (url) {
                              navigate(url);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-primary">Reported Content:</p>
                            <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-pulse transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </div>
                          <div className="flex gap-2.5">
                            {/* Content Image */}
                            {report.content_image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={getFullImageUrl(report.content_image) || ''}
                                  alt="Content preview"
                                  className="w-20 h-20 object-cover rounded-lg border border-subtle shadow-md"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Image';
                                  }}
                                />
                              </div>
                            )}
                            {/* Content Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-primary mb-1 group-hover:text-pulse transition-colors line-clamp-2">
                                {report.content_title}
                              </p>
                              {report.content_description && (
                                <p className="text-xs text-gray-300 line-clamp-2 mb-1">
                                  {report.content_description}
                                </p>
                              )}
                              {!report.content_description && (
                                <p className="text-xs text-gray-300 italic mb-1">No description</p>
                              )}
                              <p className="text-xs text-gray-300 mt-auto">
                                Click to view
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                <div className="text-center py-12 text-gray-300">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reported users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportedUsers.map((user) => (
                    <div key={user.id} className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-xl p-4 hover:bg-surface-glass/70 transition-all shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full border border-subtle overflow-hidden flex-shrink-0">
                            {user.profile_photo_url ? (
                              <img
                                src={getFullImageUrl(user.profile_photo_url) || ''}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const placeholder = (e.target as HTMLImageElement).parentElement?.querySelector('.avatar-placeholder') as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`avatar-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-pulse to-purple-600 text-white font-semibold text-sm ${user.profile_photo_url ? 'hidden' : 'flex'}`}
                            >
                              {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary">{user.username}</h3>
                            <p className="text-sm text-gray-300">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getAccountStatusBadge(user.account_status)}`}>
                                {user.account_status.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-300">
                                {user.active_warnings} warnings • {user.report_count} reports
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                          <button
                            onClick={() => window.open(`/profile/${user.username}`, '_blank')}
                            className="px-3 py-1.5 text-xs bg-pulse text-white rounded hover:bg-pulse/80 transition-colors flex items-center gap-1"
                            title="View Profile"
                          >
                            <ExternalLink size={14} />
                            View
                          </button>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {(user.account_status === 'active' || user.account_status === 'suspended') && (
                              <>
                                <button
                                  onClick={() => handleOpenActionModal(user, 'warn')}
                                  className="px-3 py-1.5 text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 rounded transition-colors flex items-center gap-1"
                                  title="Issue Warning"
                                >
                                  <AlertTriangle size={14} />
                                  Warn
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(user, 'suspend')}
                                  className="px-3 py-1.5 text-xs bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 rounded transition-colors flex items-center gap-1"
                                  title="Suspend User"
                                >
                                  <Clock size={14} />
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(user, 'ban')}
                                  className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded transition-colors flex items-center gap-1"
                                  title="Ban User"
                                >
                                  <Ban size={14} />
                                  Ban
                                </button>
                              </>
                            )}
                            
                            {(user.account_status === 'suspended' || user.account_status === 'banned') && (
                              <button
                                onClick={() => handleOpenActionModal(user, 'reinstate')}
                                className="px-3 py-1.5 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded transition-colors flex items-center gap-1"
                                title="Reinstate User"
                              >
                                <CheckCircle2 size={14} />
                                Reinstate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action History Tab */}
          {activeTab === 'actions' && (
            <div className="p-6">
              {/* Filter Bar */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-muted" />
                <span className="text-sm text-gray-300">Filter by action:</span>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-4 py-2 bg-base border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-pulse"
                >
                  <option value="all">All Actions</option>
                  <option value="content_removal">Content Removed</option>
                  <option value="report_status_update">Report Updates</option>
                  <option value="warning_issued">Warnings</option>
                  <option value="user_suspension">Suspensions</option>
                  <option value="user_ban">Bans</option>
                  <option value="user_reinstatement">Reinstatements</option>
                </select>
                <div className="ml-auto text-sm text-gray-400">
                  Total: {actions.length} actions
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
                </div>
              ) : actions.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No actions logged</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedActions).map(([date, dateActions]) => (
                    <div key={date} className="relative">
                      {/* Date Header */}
                      <div className="sticky top-0 z-10 mb-4 pb-2 bg-surface-glass backdrop-blur-glass border-b border-subtle/30 rounded-t-lg px-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-pulse" />
                          <h3 className="text-lg font-semibold text-primary">{date}</h3>
                          <span className="text-xs text-gray-400 px-2 py-0.5 bg-base rounded border border-subtle/30">
                            {dateActions.length} {dateActions.length === 1 ? 'action' : 'actions'}
                          </span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="relative pl-8">
                        {/* Timeline Line */}
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pulse/30 via-pulse/20 to-transparent"></div>

                        {/* Actions */}
                        <div className="space-y-4">
                          {dateActions.map((action) => {
                            const actionDetails = (() => {
                              switch (action.action_type) {
                                case 'content_removal':
                                  return {
                                    title: 'Content Removed',
                                    description: action.target_title 
                                      ? `${action.target_type === 'recommendation' ? 'Recommendation' : action.target_type === 'trip' ? 'Trip' : 'Content'} "${action.target_title}" was removed`
                                      : `${action.target_type} #${action.target_id} was removed`,
                                    affectedUser: action.affected_username
                                  };
                                case 'report_status_update':
                                  return {
                                    title: 'Report Status Updated',
                                    description: action.target_title || `Report #${action.target_id} status changed`,
                                    affectedUser: null
                                  };
                                case 'warning_issued':
                                  return {
                                    title: 'Warning Issued',
                                    description: action.target_title 
                                      ? `Warning issued to user "${action.target_title}"`
                                      : `Warning issued to user #${action.target_id}`,
                                    affectedUser: action.affected_username || action.target_title
                                  };
                                case 'user_suspension':
                                  return {
                                    title: 'User Suspended',
                                    description: action.target_title 
                                      ? `User "${action.target_title}" was suspended`
                                      : `User #${action.target_id} was suspended`,
                                    affectedUser: action.affected_username || action.target_title
                                  };
                                case 'user_ban':
                                  return {
                                    title: 'User Banned',
                                    description: action.target_title 
                                      ? `User "${action.target_title}" was banned`
                                      : `User #${action.target_id} was banned`,
                                    affectedUser: action.affected_username || action.target_title
                                  };
                                case 'user_reinstatement':
                                  return {
                                    title: 'User Reinstated',
                                    description: action.target_title 
                                      ? `User "${action.target_title}" was reinstated`
                                      : `User #${action.target_id} was reinstated`,
                                    affectedUser: action.affected_username || action.target_title
                                  };
                                default:
                                  return {
                                    title: action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                    description: action.reason,
                                    affectedUser: action.affected_username
                                  };
                              }
                            })();

                            return (
                              <div key={action.id} className="relative group">
                                  {/* Timeline Dot */}
                                  <div className={`absolute -left-[29px] top-2 w-3 h-3 rounded-full border-2 border-base ${getActionColor(action.action_type).split(' ')[0]} bg-base shadow-lg z-10`}></div>
                                
                                {/* Action Card */}
                                <div className={`border-l-4 ${getActionColor(action.action_type)} border border-subtle rounded-r-xl p-4 hover:bg-surface-glass/30 transition-all duration-200 shadow-lg hover:shadow-xl`}>
                                  <div className="flex items-start gap-3">
                                      {/* Icon */}
                                      <div className={`p-2 rounded-lg bg-base border border-subtle flex-shrink-0 ${getActionColor(action.action_type)}`}>
                                      {getActionIcon(action.action_type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                                          <h4 className="text-sm font-semibold text-primary mb-1">
                                            {actionDetails.title}
                                          </h4>
                                          <p className="text-xs text-gray-300 mb-2 leading-relaxed">
                                            {actionDetails.description}
                                          </p>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-base border border-subtle text-pulse capitalize flex-shrink-0">
                                          {action.target_type}
                                        </span>
                                      </div>

                                      {/* Metadata Grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 p-2.5 bg-surface-glass/30 rounded-lg border border-subtle/20">
                                        {/* Time Information */}
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-muted" />
                                            <div className="flex flex-col">
                                              <span className="text-xs text-gray-300 font-medium">
                                                {getFullDateTime(action.created_at).time}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                {getRelativeTime(action.created_at)}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-muted" />
                                            <span className="text-xs text-gray-300">
                                              {getFullDateTime(action.created_at).date}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Target and User Information */}
                                        <div className="space-y-1.5">
                                          {actionDetails.affectedUser && (
                                            <div className="flex items-center gap-2">
                                              <User className="w-3.5 h-3.5 text-muted" />
                                              <span className="text-xs text-gray-300">
                                                <span className="font-medium">Affected:</span>{' '}
                                                <button
                                                  onClick={() => navigate(`/profile/${actionDetails.affectedUser}`)}
                                                  className="text-pulse hover:underline"
                                                >
                                                  @{actionDetails.affectedUser}
                                                </button>
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <Hash className="w-3.5 h-3.5 text-muted" />
                                            <span className="text-xs text-gray-300">
                                              <span className="font-medium">Target ID:</span> {action.target_id}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Additional Metadata */}
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-glass/50 rounded border border-subtle/20">
                                          <Info className="w-3 h-3 text-muted" />
                                          <span className="text-xs text-gray-400">
                                            Action ID: <span className="text-gray-300 font-mono">{action.id}</span>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-glass/50 rounded border border-subtle/20">
                                          <Hash className="w-3 h-3 text-muted" />
                                          <span className="text-xs text-gray-400">
                                            Type: <span className="text-gray-300 capitalize">{action.target_type}</span>
                                          </span>
                                        </div>
                                        {action.target_title && (
                                          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-glass/50 rounded border border-subtle/20 max-w-xs">
                                            <FileText className="w-3 h-3 text-muted flex-shrink-0" />
                                            <span className="text-xs text-gray-400 truncate">
                                              Title: <span className="text-gray-300 truncate">{action.target_title}</span>
                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Reason and Notes */}
                                      <div className="space-y-1.5 mb-3">
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-400 mt-0.5">Reason:</span>
                                          <p className="text-xs text-gray-300 flex-1">{action.reason}</p>
                          </div>
                          {action.notes && (
                                          <div className="bg-surface-glass/50 rounded p-2 border border-subtle/30">
                                            <p className="text-xs text-gray-400 italic">
                                              {action.notes}
                                            </p>
                                          </div>
                          )}
                                      </div>

                                      {/* Footer */}
                                      <div className="flex items-center justify-between pt-2 border-t border-subtle/20">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-muted" />
                                            <span className="text-xs text-gray-400">
                                              Moderator: <span className="font-medium text-primary">@{action.moderator_username}</span>
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-muted" />
                                            <span className="text-xs text-gray-400">
                                              Mod ID: <span className="text-gray-300 font-mono">{action.moderator_id}</span>
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                          {new Date(action.created_at).toISOString().split('T')[0]} {new Date(action.created_at).toTimeString().split(' ')[0]}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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

      {/* User Action Modals */}
      {selectedUser && actionModalType && (
        <>
          {/* Issue Warning Modal */}
          {actionModalType === 'warn' && (
            <UserActionModal
              isOpen={true}
              onClose={handleCloseActionModal}
              user={selectedUser}
              actionType="warn"
              onSubmit={(formData) => {
                handleIssueWarning(
                  formData.warningType || 'other',
                  formData.message || '',
                  formData.severity || 'low'
                );
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Suspend User Modal */}
          {actionModalType === 'suspend' && (
            <UserActionModal
              isOpen={true}
              onClose={handleCloseActionModal}
              user={selectedUser}
              actionType="suspend"
              onSubmit={(formData) => {
                handleSuspendUser(
                  formData.reason || '',
                  parseInt(formData.days || '7')
                );
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Ban User Modal */}
          {actionModalType === 'ban' && (
            <UserActionModal
              isOpen={true}
              onClose={handleCloseActionModal}
              user={selectedUser}
              actionType="ban"
              onSubmit={(formData) => {
                handleBanUser(formData.reason || '');
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Reinstate User Modal */}
          {actionModalType === 'reinstate' && (
            <UserActionModal
              isOpen={true}
              onClose={handleCloseActionModal}
              user={selectedUser}
              actionType="reinstate"
              onSubmit={(formData) => {
                handleReinstateUser(formData.reason);
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </>
      )}
    </div>
  );
};

// User Action Modal Component
interface UserActionFormData {
  warningType?: string;
  message?: string;
  severity?: 'low' | 'medium' | 'high';
  reason?: string;
  days?: string;
}

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ReportedUser;
  actionType: 'warn' | 'suspend' | 'ban' | 'reinstate';
  onSubmit: (formData: UserActionFormData) => void;
  isSubmitting: boolean;
}

const UserActionModal: React.FC<UserActionModalProps> = ({
  isOpen,
  onClose,
  user,
  actionType,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<UserActionFormData>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getModalTitle = () => {
    switch (actionType) {
      case 'warn':
        return `Issue Warning to ${user.username}`;
      case 'suspend':
        return `Suspend ${user.username}`;
      case 'ban':
        return `Ban ${user.username}`;
      case 'reinstate':
        return `Reinstate ${user.username}`;
      default:
        return 'User Action';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {actionType === 'warn' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Warning Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.warningType || ''}
                onChange={(e) => setFormData({ ...formData, warningType: e.target.value })}
                className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                required
              >
                <option value="">Select warning type</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="harassment">Harassment</option>
                <option value="impersonation">Impersonation</option>
                <option value="violation">Policy Violation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity || 'low'}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
                rows={4}
                placeholder="Enter warning message..."
                required
              />
            </div>
          </>
        )}

        {actionType === 'suspend' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Suspension Duration (days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.days || '7'}
                onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
                rows={4}
                placeholder="Enter suspension reason..."
                required
              />
            </div>
          </>
        )}

        {actionType === 'ban' && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
              rows={4}
              placeholder="Enter ban reason..."
              required
            />
            <p className="mt-2 text-xs text-yellow-400">
              ⚠️ Warning: This action will permanently ban the user. They will not be able to access their account.
            </p>
          </div>
        )}

        {actionType === 'reinstate' && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 bg-base border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
              rows={4}
              placeholder="Enter reinstatement reason (optional)..."
            />
            <p className="mt-2 text-xs text-green-400">
              ✓ This will restore the user's account and remove all active warnings.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-primary font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'ban'
                ? 'bg-red-600 hover:bg-red-700'
                : actionType === 'reinstate'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-pulse hover:bg-pulse/90'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : actionType === 'warn' ? 'Issue Warning' : actionType === 'suspend' ? 'Suspend User' : actionType === 'ban' ? 'Ban User' : 'Reinstate User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModeratorDashboard;

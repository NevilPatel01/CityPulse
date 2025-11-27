import { apiRequest, buildApiUrl } from '../config/api';

export interface DashboardStats {
    pending_reports: number;
    under_review_reports: number;
    reported_recommendations: number;
    suspended_users: number;
    banned_users: number;
    active_warnings: number;
    my_actions_30d: number;
}

export interface ContentReport {
    id: number;
    reporter_id: number;
    reporter_username: string;
    reporter_photo: string | null;
    reported_content_type: string;
    reported_content_id: number;
    content_title: string;
    content_description: string | null;
    content_image: string | null;
    content_owner_username: string | null;
    report_reason: string;
    description: string;
    status: string;
    reviewed_by: number | null;
    reviewer_username: string | null;
    reviewed_at: string | null;
    created_at: string;
}

export interface UserWarning {
    id: number;
    user_id: number;
    moderator_id: number;
    moderator_username: string;
    warning_type: string;
    message: string;
    is_active: boolean;
    created_at: string;
}

export interface ModeratorAction {
    id: number;
    moderator_id: number;
    moderator_username: string;
    moderator_photo: string | null;
    action_type: string;
    target_type: string;
    target_id: number;
    reason: string;
    notes: string | null;
    created_at: string;
    target_title?: string | null;
    affected_user_id?: number | null;
    affected_username?: string | null;
}

export interface ReportedUser {
    id: number;
    username: string;
    email: string;
    account_status: string;
    profile_photo_url: string | null;
    active_warnings: number;
    report_count: number;
    created_at: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const url = buildApiUrl('api/moderator/dashboard/stats');
    const response = await apiRequest<{ success: boolean; data: DashboardStats }>(url);
    return response.data;
};

export const getContentReports = async (
    page: number = 1,
    limit: number = 20,
    status: string = 'all',
    contentType: string = 'all'
) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        contentType
    });
    const url = buildApiUrl(`api/moderator/reports?${params.toString()}`);
    return await apiRequest(url);
};

export const updateReportStatus = async (
    reportId: number,
    status: string,
    notes?: string
) => {
    const url = buildApiUrl(`api/moderator/reports/${reportId}/status`);
    return await apiRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
    });
};

export const removeContent = async (
    contentType: string,
    contentId: number,
    reason: string,
    notifyUser: boolean = true
) => {
    const url = buildApiUrl(`api/moderator/content/${contentType}/${contentId}`);
    return await apiRequest(url, {
        method: 'DELETE',
        body: JSON.stringify({ reason, notifyUser })
    });
};

export const issueWarning = async (
    userId: number,
    warningType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' = 'low'
) => {
    const url = buildApiUrl(`api/moderator/users/${userId}/warn`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ warningType, message, severity })
    });
};

export const suspendUser = async (
    userId: number,
    reason: string,
    days: number = 7
) => {
    const url = buildApiUrl(`api/moderator/users/${userId}/suspend`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ reason, days })
    });
};

export const banUser = async (userId: number, reason: string) => {
    const url = buildApiUrl(`api/moderator/users/${userId}/ban`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
};

export const reinstateUser = async (userId: number, reason?: string) => {
    const url = buildApiUrl(`api/moderator/users/${userId}/reinstate`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
};

export const getUserWarnings = async (userId: number): Promise<UserWarning[]> => {
    const url = buildApiUrl(`api/moderator/users/${userId}/warnings`);
    const response = await apiRequest<{ success: boolean; data: UserWarning[] }>(url);
    return response.data;
};

export const getModeratorActions = async (page: number = 1, limit: number = 50) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/moderator/actions?${params.toString()}`);
    return await apiRequest(url);
};

export const getReportedUsers = async (page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/moderator/users/reported?${params.toString()}`);
    return await apiRequest(url);
};

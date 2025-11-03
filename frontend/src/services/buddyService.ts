import { apiRequest, buildApiUrl } from '../config/api';

export interface BuddyRequest {
    id: number;
    requester_id?: number;
    requested_id?: number;
    request_message?: string;
    status: 'pending' | 'accepted' | 'declined';
    requested_at: string;
    username: string;
    full_name: string;
    profile_photo_url?: string;
}

export interface Buddy {
    id: number;
    username: string;
    full_name: string;
    bio?: string;
    current_location?: string;
    profile_photo_url?: string;
    connected_at: string;
}

export interface BlockedUser {
    id: number;
    username: string;
    full_name: string;
    profile_photo_url?: string;
    blocked_at: string;
}

export interface BuddyStatus {
    status: 'none' | 'pending' | 'accepted' | 'declined';
    requestDirection?: 'sent' | 'received';
    isBlocked: boolean;
}

// Send a buddy request
export const sendBuddyRequest = async (targetUserId: number, message?: string) => {
    return await apiRequest(buildApiUrl('api/buddies/request'), {
        method: 'POST',
        body: JSON.stringify({ targetUserId, message })
    });
};

// Get received buddy requests
export const getReceivedBuddyRequests = async (): Promise<{ success: boolean; data: { requests: BuddyRequest[] } }> => {
    return await apiRequest(buildApiUrl('api/buddies/requests/received'), {
        method: 'GET'
    });
};

// Get sent buddy requests
export const getSentBuddyRequests = async (): Promise<{ success: boolean; data: { requests: BuddyRequest[] } }> => {
    return await apiRequest(buildApiUrl('api/buddies/requests/sent'), {
        method: 'GET'
    });
};

// Accept buddy request
export const acceptBuddyRequest = async (requestId: number) => {
    return await apiRequest(buildApiUrl(`api/buddies/requests/${requestId}/accept`), {
        method: 'POST'
    });
};

// Decline buddy request
export const declineBuddyRequest = async (requestId: number) => {
    return await apiRequest(buildApiUrl(`api/buddies/requests/${requestId}/decline`), {
        method: 'POST'
    });
};

// Cancel sent buddy request
export const cancelBuddyRequest = async (requestId: number) => {
    return await apiRequest(buildApiUrl(`api/buddies/requests/${requestId}`), {
        method: 'DELETE'
    });
};

// Get all buddies
export const getBuddies = async (): Promise<{ success: boolean; data: { buddies: Buddy[] } }> => {
    return await apiRequest(buildApiUrl('api/buddies'), {
        method: 'GET'
    });
};

// Remove buddy
export const removeBuddy = async (buddyId: number) => {
    return await apiRequest(buildApiUrl(`api/buddies/${buddyId}`), {
        method: 'DELETE'
    });
};

// Block user
export const blockUser = async (targetUserId: number) => {
    return await apiRequest(buildApiUrl('api/buddies/block'), {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
    });
};

// Unblock user
export const unblockUser = async (targetUserId: number) => {
    return await apiRequest(buildApiUrl(`api/buddies/block/${targetUserId}`), {
        method: 'DELETE'
    });
};

// Get blocked users
export const getBlockedUsers = async (): Promise<{ success: boolean; data: { blockedUsers: BlockedUser[] } }> => {
    return await apiRequest(buildApiUrl('api/buddies/blocked'), {
        method: 'GET'
    });
};

// Check buddy status with a user
export const checkBuddyStatus = async (targetUserId: number): Promise<{ success: boolean; data: BuddyStatus }> => {
    return await apiRequest(buildApiUrl(`api/buddies/status/${targetUserId}`), {
        method: 'GET'
    });
};

// Report user
export const reportUser = async (targetUserId: number, reportReason: string, description?: string) => {
    return await apiRequest(buildApiUrl('api/buddies/report'), {
        method: 'POST',
        body: JSON.stringify({ targetUserId, reportReason, description })
    });
};

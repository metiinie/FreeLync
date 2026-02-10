import { api } from './api';

export interface Dispute {
    id: string;
    transaction_id: string;
    initiator_id: string;
    respondent_id: string;
    assigned_admin_id: string | null;
    status: 'OPEN' | 'EVIDENCE_PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
    reason: string;
    description: string;
    amount_claimed: number;
    resolution: string | null;
    resolution_notes: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    transaction?: any;
    initiator?: { full_name: string; email: string };
    respondent?: { full_name: string; email: string };
    assigned_admin?: { full_name: string; email: string };
    evidence?: any[];
    messages?: any[];
}

export const DisputesService = {
    // User endpoints
    getDisputes: async () => {
        const response = await api.get('/disputes');
        return response.data;
    },

    getDisputeById: async (id: string) => {
        const response = await api.get(`/disputes/${id}`);
        return response.data;
    },

    createDispute: async (data: { transaction_id: string; reason: string; description: string; amount_claimed: number }) => {
        const response = await api.post('/disputes', data);
        return response.data;
    },

    addEvidence: async (id: string, data: { file_url: string; file_type: string; description?: string }) => {
        const response = await api.post(`/disputes/${id}/evidence`, data);
        return response.data;
    },

    addMessage: async (id: string, data: { content: string }) => {
        const response = await api.post(`/disputes/${id}/messages`, data);
        return response.data;
    },

    // Admin endpoints
    getAllDisputesAsAdmin: async () => {
        const response = await api.get('/admin/disputes');
        return response.data;
    },

    getDisputeByIdAsAdmin: async (id: string) => {
        const response = await api.get(`/admin/disputes/${id}`);
        return response.data;
    },

    assignDispute: async (id: string) => {
        const response = await api.post(`/admin/disputes/${id}/assign`);
        return response.data;
    },

    resolveDispute: async (id: string, data: { resolution: string; notes: string }) => {
        const response = await api.patch(`/admin/disputes/${id}/resolve`, data);
        return response.data;
    },

    addAdminMessage: async (id: string, data: { content: string; is_internal?: boolean }) => {
        const response = await api.post(`/admin/disputes/${id}/messages`, data);
        return response.data;
    },
};

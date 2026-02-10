import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getMediaUrl = (path: string | null | undefined) => {
    if (!path) return '/placeholder-image.jpg';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const adminToken = localStorage.getItem('adminToken');
        const token = localStorage.getItem('token');

        if (config.url?.startsWith('/admin/') && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Optional: redirect to login
        }
        return Promise.reject(error);
    }
);

export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        profile: '/auth/profile',
    },
    users: {
        list: '/users',
        detail: (id: string) => `/users/${id}`,
        update: (id: string) => `/users/${id}`,
    },
    listings: {
        list: '/listings',
        detail: (id: string) => `/listings/${id}`,
        create: '/listings',
        update: (id: string) => `/listings/${id}`,
        updateStatus: (id: string) => `/listings/${id}/status`,
        delete: (id: string) => `/listings/${id}`,
        uploadImage: '/listings/upload', // If separate endpoint
    },
    transactions: {
        list: '/transactions',
        detail: (id: string) => `/transactions/${id}`,
        create: '/transactions',
        updateStatus: (id: string) => `/transactions/${id}/status`,
    },
    notifications: {
        list: '/notifications',
        markRead: (id: string) => `/notifications/${id}/read`,
    },
    favorites: {
        list: '/favorites',
        toggle: (id: string) => `/favorites/${id}`,
        check: (id: string) => `/favorites/${id}/check`,
    },
    inquiries: {
        create: '/inquiries',
        list: '/inquiries',
    },
    payment: {
        initialize: '/payment/initialize',
        verify: '/payment/verify',
    },
    upload: {
        file: '/upload/file',
        files: '/upload/files',
    }
};

import axios from 'axios';

// Backend is running on port 3000 with global prefix 'api'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
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

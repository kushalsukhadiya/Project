const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMessage = data.message || `API error (status: ${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
};

export const api = {
  // Generic fetch operations
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  post: async (endpoint: string, body: any, isMultipart = false) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body)
    });
    return handleResponse(res);
  },

  put: async (endpoint: string, body?: any, isMultipart = false) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(isMultipart),
      body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined
    });
    return handleResponse(res);
  },

  delete: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Auth Operations
  auth: {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (userData: any) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (profileData: any) => api.put('/auth/profile', profileData),
    getLeaderboard: () => api.get('/auth/leaderboard')
  },

  // Plastic Requests Operations
  requests: {
    create: (formData: FormData) => api.post('/requests', formData, true),
    classifyImage: (formData: FormData) => api.post('/requests/classify-image', formData, true),
    myRequests: () => api.get('/requests/my'),
    getDetails: (id: string) => api.get(`/requests/${id}`),
    cancel: (id: string) => api.put(`/requests/${id}/cancel`),
    submitFeedback: (id: string, rating: number, comment: string) => 
      api.post(`/requests/${id}/feedback`, { rating, comment })
  },

  // Collector Operations
  collector: {
    toggleAvailability: (availability: boolean) => api.put('/collector/availability', { availability }),
    getPendingJobs: (filters: { city?: string; area?: string; wasteCategory?: string } = {}) => {
      const query = new URLSearchParams(filters as any).toString();
      return api.get(`/collector/jobs/pending?${query}`);
    },
    acceptJob: (id: string) => api.put(`/collector/jobs/${id}/accept`),
    rejectJob: (id: string) => api.put(`/collector/jobs/${id}/reject`),
    pickupJob: (id: string, formData: FormData) => api.put(`/collector/jobs/${id}/pickup`, formData, true),
    getStats: () => api.get('/collector/stats')
  },

  // Recycler Operations
  recycler: {
    getShipments: (status?: string) => api.get(`/recycler/shipments${status ? `?status=${status}` : ''}`),
    confirmReceipt: (id: string) => api.put(`/recycler/shipments/${id}/receive`),
    markRecycled: (id: string) => api.put(`/recycler/shipments/${id}/recycle`),
    getStats: () => api.get('/recycler/stats')
  },

  // Admin Operations
  admin: {
    getAnalytics: () => api.get('/admin/analytics'),
    getUsers: () => api.get('/admin/users'),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    verifyRequest: (id: string) => api.put(`/admin/requests/${id}/verify`),
    getAllRequests: () => api.get('/admin/requests'),
    getFeedback: () => api.get('/admin/feedback')
  },

  // Notifications Operations
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all')
  }
};

const API_BASE_URL = 'http://localhost:5000/api';

const checkBackend = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE_URL}`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (e) {
    return false;
  }
};

const handleResponse = async (response) => {
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

const runRequest = async (method, endpoint, body = null, isMultipart = false) => {
  const online = await checkBackend();
  if (!online) {
    console.warn('[EcoCycle] Backend offline. Using local storage mock mode.');
    return handleMockRequest(method, endpoint, body, isMultipart);
  }

  // Real fetch options
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return await handleResponse(res);
  } catch (err) {
    console.warn('[EcoCycle] Backend request failed. Falling back to local storage mock mode.', err);
    return handleMockRequest(method, endpoint, body, isMultipart);
  }
};

const api = {
  get: async (endpoint) => runRequest('GET', endpoint),
  post: async (endpoint, body, isMultipart = false) => runRequest('POST', endpoint, body, isMultipart),
  put: async (endpoint, body, isMultipart = false) => runRequest('PUT', endpoint, body, isMultipart),
  delete: async (endpoint) => runRequest('DELETE', endpoint),

  // Auth Operations
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
    getLeaderboard: () => api.get('/auth/leaderboard')
  },

  // Plastic Requests Operations
  requests: {
    create: (formData) => api.post('/requests', formData, true),
    classifyImage: (formData) => api.post('/requests/classify-image', formData, true),
    myRequests: () => api.get('/requests/my'),
    getDetails: (id) => api.get(`/requests/${id}`),
    cancel: (id) => api.put(`/requests/${id}/cancel`),
    submitFeedback: (id, rating, comment) => 
      api.post(`/requests/${id}/feedback`, { rating, comment })
  },

  // Collector Operations
  collector: {
    toggleAvailability: (availability) => api.put('/collector/availability', { availability }),
    getPendingJobs: (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      return api.get(`/collector/jobs/pending?${query}`);
    },
    acceptJob: (id) => api.put(`/collector/jobs/${id}/accept`),
    rejectJob: (id) => api.put(`/collector/jobs/${id}/reject`),
    pickupJob: (id, formData) => api.put(`/collector/jobs/${id}/pickup`, formData, true),
    getStats: () => api.get('/collector/stats')
  },

  // Recycler Operations
  recycler: {
    getShipments: (status) => api.get(`/recycler/shipments${status ? `?status=${status}` : ''}`),
    confirmReceipt: (id) => api.put(`/recycler/shipments/${id}/receive`),
    markRecycled: (id) => api.put(`/recycler/shipments/${id}/recycle`),
    getStats: () => api.get('/recycler/stats')
  },

  // Admin Operations
  admin: {
    getAnalytics: () => api.get('/admin/analytics'),
    getUsers: () => api.get('/admin/users'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    verifyRequest: (id) => api.put(`/admin/requests/${id}/verify`),
    getAllRequests: () => api.get('/admin/requests'),
    getFeedback: () => api.get('/admin/feedback')
  },

  // Notifications Operations
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all')
  }
};

// ==========================================
// LOCAL STORAGE MOCK DATABASE LAYER
// ==========================================

const initMockDB = () => {
  if (!localStorage.getItem('mock_users')) {
    const users = [
      {
        _id: 'user_citizen',
        name: 'Aarav Patel',
        email: 'citizen@ecocycle.com',
        password: 'Password123',
        role: 'citizen',
        phoneNumber: '9876543210',
        address: 'Apt 402, Bandra Heights',
        city: 'Mumbai',
        area: 'Bandra',
        rewards: { points: 450, tier: 'Silver' },
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
      },
      {
        _id: 'user_collector',
        name: 'Rajesh Kumar (NGO Collector)',
        email: 'collector@ecocycle.com',
        password: 'Password123',
        role: 'collector',
        phoneNumber: '9123456789',
        address: 'Colaba Transit Camp',
        city: 'Mumbai',
        area: 'Colaba',
        collectorDetails: { availability: true, earnings: 1200, completedJobsToday: 2 },
        profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
      },
      {
        _id: 'user_recycler',
        name: 'GreenTech Recycling Center',
        email: 'recycler@ecocycle.com',
        password: 'Password123',
        role: 'recycler',
        phoneNumber: '9988776655',
        address: 'Goregaon Industrial Estate',
        city: 'Mumbai',
        area: 'Goregaon',
        recyclerDetails: { facilityName: 'GreenTech Recyclers Mumbai', capacity: 15000 },
        profilePicture: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&h=150&q=80'
      },
      {
        _id: 'user_admin',
        name: 'Esha Sharma (System Admin)',
        email: 'admin@ecocycle.com',
        password: 'Password123',
        role: 'admin',
        phoneNumber: '9000000000',
        address: 'EcoCycle Headquarters, BKC',
        city: 'Mumbai',
        area: 'BKC',
        rewards: { points: 0, tier: 'Bronze' },
        collectorDetails: { availability: false, earnings: 0, completedJobsToday: 0 },
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
      }
    ];
    localStorage.setItem('mock_users', JSON.stringify(users));
  }

  if (!localStorage.getItem('mock_requests')) {
    const reqs = [
      {
        _id: 'req_1',
        citizenId: { _id: 'user_citizen', name: 'Aarav Patel' },
        collectorId: null,
        recyclerId: null,
        wasteCategory: 'Plastic Bottles',
        estimatedWeight: 8.5,
        pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: { coordinates: [72.8400, 19.0500], address: 'Bandra Bandstand, Bandra West, Mumbai, 400050' },
        imageUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80',
        status: 'pending',
        history: [{ status: 'pending', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'req_2',
        citizenId: { _id: 'user_citizen', name: 'Aarav Patel' },
        collectorId: { _id: 'user_collector', name: 'Rajesh Kumar (NGO Collector)', phoneNumber: '9123456789' },
        recyclerId: null,
        wasteCategory: 'PET Bottles',
        estimatedWeight: 12.0,
        pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: { coordinates: [72.8777, 19.0760], address: 'Andheri East Station, Mumbai, 400069' },
        imageUrl: 'https://images.unsplash.com/photo-1526653098496-8fa35f0dd169?auto=format&fit=crop&w=600&q=80',
        status: 'accepted',
        history: [
          { status: 'pending', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { status: 'accepted', timestamp: new Date().toISOString() }
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    localStorage.setItem('mock_requests', JSON.stringify(reqs));
  }

  if (!localStorage.getItem('mock_notifications')) {
    const notifs = [
      {
        _id: 'notif_1',
        title: 'Welcome to EcoCycle',
        message: 'Start reporting your household plastic to earn reward points.',
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('mock_notifications', JSON.stringify(notifs));
  }

  if (!localStorage.getItem('mock_feedback')) {
    localStorage.setItem('mock_feedback', JSON.stringify([]));
  }
};

const handleMockRequest = (method, endpoint, body, isMultipart) => {
  initMockDB();
  
  const getLoggedInUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Auth Operations
  if (endpoint === '/auth/login') {
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const found = users.find(u => u.email === body.email && u.password === body.password);
    if (!found) throw new Error('Invalid email or password');
    return { token: 'mock_token_' + found._id, user: found };
  }
  
  if (endpoint === '/auth/register') {
    const users = JSON.parse(localStorage.getItem('mock_users'));
    if (users.some(u => u.email === body.email)) {
      throw new Error('Email address already exists.');
    }
    const newUser = {
      _id: 'mock_user_' + Date.now(),
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      phoneNumber: body.phoneNumber,
      address: body.address || '',
      city: body.city,
      area: body.area,
      rewards: { points: 0, tier: 'Bronze' },
      collectorDetails: { availability: false, earnings: 0, completedJobsToday: 0 },
      recyclerDetails: { facilityName: body.facilityName || '', capacity: body.capacity || 10000 },
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    };
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { token: 'mock_token_' + newUser._id, user: newUser };
  }
  
  if (endpoint === '/auth/me') {
    const loggedUser = getLoggedInUser();
    if (!loggedUser) throw new Error('Not authenticated');
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const fresh = users.find(u => u._id === loggedUser._id);
    return fresh || loggedUser;
  }
  
  if (endpoint === '/auth/profile') {
    const loggedUser = getLoggedInUser();
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const idx = users.findIndex(u => u._id === loggedUser._id);
    if (idx === -1) throw new Error('User not found');
    
    users[idx] = {
      ...users[idx],
      name: body.name,
      phoneNumber: body.phoneNumber,
      address: body.address,
      city: body.city,
      area: body.area,
      profilePicture: body.profilePicture || users[idx].profilePicture
    };
    if (users[idx].role === 'recycler') {
      users[idx].recyclerDetails = {
        facilityName: body.facilityName,
        capacity: parseInt(body.capacity) || 10000
      };
    }
    localStorage.setItem('mock_users', JSON.stringify(users));
    return users[idx];
  }
  
  if (endpoint === '/auth/leaderboard') {
    const users = JSON.parse(localStorage.getItem('mock_users'));
    return users.filter(u => u.role === 'citizen').sort((a, b) => b.rewards.points - a.rewards.points);
  }

  // Request Operations
  if (endpoint === '/requests/my') {
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    return reqs.filter(r => r.citizenId?._id === loggedUser._id);
  }

  if (endpoint === '/requests' && method === 'POST') {
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    
    let category = 'Other';
    let weight = 5;
    let pickupDate = new Date().toISOString();
    let addressStr = '';
    let lat = 19.0760;
    let lng = 72.8777;

    if (body instanceof FormData) {
      category = body.get('wasteCategory') || 'Other';
      weight = parseFloat(body.get('estimatedWeight')) || 5;
      pickupDate = body.get('pickupDate') || new Date().toISOString();
      addressStr = body.get('address') || '';
      lat = parseFloat(body.get('latitude')) || 19.0760;
      lng = parseFloat(body.get('longitude')) || 72.8777;
    } else {
      category = body.wasteCategory;
      weight = body.estimatedWeight;
      pickupDate = body.pickupDate;
      addressStr = body.address;
      lat = body.latitude;
      lng = body.longitude;
    }

    const newReq = {
      _id: 'mock_req_' + Date.now(),
      citizenId: { _id: loggedUser._id, name: loggedUser.name },
      collectorId: null,
      recyclerId: null,
      wasteCategory: category,
      estimatedWeight: weight,
      pickupDate,
      location: { coordinates: [lng, lat], address: addressStr },
      imageUrl: 'https://images.unsplash.com/photo-1526653098496-8fa35f0dd169?auto=format&fit=crop&w=600&q=80',
      status: 'pending',
      history: [{ status: 'pending', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };
    reqs.unshift(newReq);
    localStorage.setItem('mock_requests', JSON.stringify(reqs));
    
    addNotification('New Request Dispatched', `Citizen ${loggedUser.name} reported ${weight}kg of ${category}.`);
    return newReq;
  }

  if (endpoint === '/requests/classify-image' && method === 'POST') {
    const categories = ['PET Bottles', 'Plastic Bottles', 'Industrial Plastic', 'Food Packaging'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    return {
      estimatedCategory: randomCat,
      confidence: 0.85 + Math.random() * 0.14,
      imageUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80'
    };
  }

  if (endpoint.startsWith('/requests/') && endpoint.endsWith('/cancel') && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].status = 'cancelled';
      reqs[idx].history.push({ status: 'cancelled', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  if (endpoint.startsWith('/requests/') && endpoint.endsWith('/feedback') && method === 'POST') {
    const id = endpoint.split('/')[2];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].feedbackRating = body.rating;
      reqs[idx].feedbackComment = body.comment;
      localStorage.setItem('mock_requests', JSON.stringify(reqs));

      const fb = JSON.parse(localStorage.getItem('mock_feedback') || '[]');
      fb.push({
        _id: 'mock_fb_' + Date.now(),
        citizenId: reqs[idx].citizenId,
        requestId: id,
        rating: body.rating,
        comment: body.comment
      });
      localStorage.setItem('mock_feedback', JSON.stringify(fb));
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  // Collector Operations
  if (endpoint === '/collector/stats') {
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    
    const active = reqs.filter(r => r.collectorId?._id === loggedUser._id && r.status === 'accepted');
    const completed = reqs.filter(r => r.collectorId?._id === loggedUser._id && (r.status === 'picked_up' || r.status === 'received' || r.status === 'recycled'));
    
    return {
      availability: true,
      earnings: loggedUser.collectorDetails?.earnings || 0,
      completedJobsToday: loggedUser.collectorDetails?.completedJobsToday || 0,
      totalCompletedJobs: completed.length,
      activeJobs: active
    };
  }

  if (endpoint === '/collector/availability') {
    const loggedUser = getLoggedInUser();
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const idx = users.findIndex(u => u._id === loggedUser._id);
    if (idx !== -1) {
      users[idx].collectorDetails.availability = body.availability;
      localStorage.setItem('mock_users', JSON.stringify(users));
      window.auth.updateUserProfile(users[idx]);
      return { availability: body.availability };
    }
    throw new Error('Collector not found');
  }

  if (endpoint.startsWith('/collector/jobs/pending')) {
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    return reqs.filter(r => r.status === 'pending');
  }

  if (endpoint.startsWith('/collector/jobs/') && endpoint.endsWith('/accept') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].status = 'accepted';
      reqs[idx].collectorId = { _id: loggedUser._id, name: loggedUser.name, phoneNumber: loggedUser.phoneNumber, profilePicture: loggedUser.profilePicture };
      reqs[idx].history.push({ status: 'accepted', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));
      
      addNotification('Request Claimed', `NGO Officer ${loggedUser.name} is dispatched to pick up your plastic.`, reqs[idx].citizenId._id);
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  if (endpoint.startsWith('/collector/jobs/') && endpoint.endsWith('/reject') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].status = 'pending';
      reqs[idx].collectorId = null;
      reqs[idx].history.push({ status: 'pending', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  if (endpoint.startsWith('/collector/jobs/') && endpoint.endsWith('/pickup') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      let recyclerId = '';
      if (body instanceof FormData) {
        recyclerId = body.get('recyclerId') || body.get('recyclingCenterId');
      } else {
        recyclerId = body.recyclerId || body.recyclingCenterId;
      }
      const recycler = users.find(u => u._id === recyclerId);

      reqs[idx].status = 'picked_up';
      reqs[idx].recyclerId = recycler ? { _id: recycler._id, name: recycler.name, facilityName: recycler.recyclerDetails?.facilityName, address: recycler.address, city: recycler.city } : null;
      reqs[idx].proofUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80';
      reqs[idx].history.push({ status: 'picked_up', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));

      addNotification('Plastic Collected', `NGO Officer picked up your plastic. Shipment transferring to facility.`, reqs[idx].citizenId._id);
      if (recycler) {
        addNotification('Incoming Shipment Dispatched', `New shipment of ${reqs[idx].estimatedWeight}kg en route.`, recycler._id);
      }
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  // Recycler Operations
  if (endpoint === '/recycler/stats') {
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    
    const incoming = reqs.filter(r => r.recyclerId?._id === loggedUser._id && r.status === 'picked_up').length;
    const received = reqs.filter(r => r.recyclerId?._id === loggedUser._id && r.status === 'received').length;
    const recycledList = reqs.filter(r => r.recyclerId?._id === loggedUser._id && r.status === 'recycled');
    const totalRecycled = recycledList.reduce((sum, r) => sum + r.estimatedWeight, 0);

    const capacity = loggedUser.recyclerDetails?.capacity || 15000;
    
    return {
      facilityName: loggedUser.recyclerDetails?.facilityName || loggedUser.name,
      capacity,
      incomingShipments: incoming,
      receivedShipments: received,
      recycledShipments: recycledList.length,
      totalRecycledWeight: totalRecycled,
      monthlyProgressPercentage: (totalRecycled / capacity) * 100
    };
  }

  if (endpoint.startsWith('/recycler/shipments')) {
    const loggedUser = getLoggedInUser();
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const status = new URLSearchParams(endpoint.split('?')[1] || '').get('status');
    
    return reqs.filter(r => r.recyclerId?._id === loggedUser._id && (!status || r.status === status));
  }

  if (endpoint.startsWith('/recycler/shipments/') && endpoint.endsWith('/receive') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].status = 'received';
      reqs[idx].history.push({ status: 'received', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));
      
      addNotification('Shipment Arrived', `Recycling facility confirmed receiving your plastic shipment.`, reqs[idx].citizenId._id);
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  if (endpoint.startsWith('/recycler/shipments/') && endpoint.endsWith('/recycle') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      reqs[idx].status = 'recycled';
      reqs[idx].history.push({ status: 'recycled', timestamp: new Date().toISOString() });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));

      addNotification('Plastic Recycled', `Plastic processed! Admin verification pending to release points.`, reqs[idx].citizenId._id);
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  // Admin Operations
  if (endpoint === '/admin/analytics') {
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));

    const colWeight = reqs.filter(r => r.status !== 'pending' && r.status !== 'cancelled').reduce((sum, r) => sum + r.estimatedWeight, 0);
    const recWeight = reqs.filter(r => r.status === 'recycled').reduce((sum, r) => sum + r.estimatedWeight, 0);

    return {
      summary: {
        totalUsers: users.length,
        totalRequests: reqs.length,
        pendingRequests: reqs.filter(r => r.status === 'pending').length,
        completedRequests: reqs.filter(r => r.status === 'recycled').length,
        activeCollectors: users.filter(u => u.role === 'collector' && u.collectorDetails?.availability).length,
        totalCollectors: users.filter(u => u.role === 'collector').length,
        totalRecyclers: users.filter(u => u.role === 'recycler').length,
        totalCollectedWeight: colWeight,
        totalRecycledWeight: recWeight
      },
      charts: {
        monthlyCollection: [
          { month: 'Jan', weight: 450 },
          { month: 'Feb', weight: 620 },
          { month: 'Mar', weight: 890 },
          { month: 'Apr', weight: 1100 },
          { month: 'May', weight: 920 },
          { month: 'Jun', weight: recWeight }
        ],
        wasteTypeDistribution: [
          { name: 'PET Bottles', value: reqs.filter(r => r.wasteCategory === 'PET Bottles').length },
          { name: 'Plastic Bottles', value: reqs.filter(r => r.wasteCategory === 'Plastic Bottles').length },
          { name: 'Industrial Plastic', value: reqs.filter(r => r.wasteCategory === 'Industrial Plastic').length },
          { name: 'Food Packaging', value: reqs.filter(r => r.wasteCategory === 'Food Packaging').length }
        ],
        userGrowth: [],
        collectorPerformance: []
      }
    };
  }

  if (endpoint === '/admin/users') {
    return JSON.parse(localStorage.getItem('mock_users'));
  }

  if (endpoint.startsWith('/admin/users/') && method === 'DELETE') {
    const id = endpoint.split('/')[3];
    const users = JSON.parse(localStorage.getItem('mock_users'));
    const filtered = users.filter(u => u._id !== id);
    localStorage.setItem('mock_users', JSON.stringify(filtered));
    return { success: true };
  }

  if (endpoint.startsWith('/admin/requests/') && endpoint.endsWith('/verify') && method === 'PUT') {
    const id = endpoint.split('/')[3];
    const reqs = JSON.parse(localStorage.getItem('mock_requests'));
    const users = JSON.parse(localStorage.getItem('mock_users'));
    
    const idx = reqs.findIndex(r => r._id === id);
    if (idx !== -1) {
      const citizenId = reqs[idx].citizenId._id;
      const citizenIdx = users.findIndex(u => u._id === citizenId);

      const weight = reqs[idx].estimatedWeight;
      const earned = Math.round(weight * 12);
      
      if (citizenIdx !== -1) {
        users[citizenIdx].rewards.points += earned;
        const p = users[citizenIdx].rewards.points;
        let tier = 'Bronze';
        if (p >= 1500) tier = 'Platinum';
        else if (p >= 800) tier = 'Gold';
        else if (p >= 300) tier = 'Silver';
        users[citizenIdx].rewards.tier = tier;
        
        localStorage.setItem('mock_users', JSON.stringify(users));
      }

      reqs[idx].rewardsEarned = earned;
      reqs[idx].history.push({ status: 'recycled', timestamp: new Date().toISOString(), comment: 'Admin verified and released reward points' });
      localStorage.setItem('mock_requests', JSON.stringify(reqs));

      addNotification('Points Released!', `Admin verified your recycling report. +${earned} points added.`, citizenId);
      return reqs[idx];
    }
    throw new Error('Request not found');
  }

  if (endpoint === '/admin/requests') {
    return JSON.parse(localStorage.getItem('mock_requests'));
  }

  if (endpoint === '/admin/feedback') {
    return JSON.parse(localStorage.getItem('mock_feedback') || '[]');
  }

  // Notifications Operations
  if (endpoint === '/notifications') {
    const loggedUser = getLoggedInUser();
    const notifs = JSON.parse(localStorage.getItem('mock_notifications'));
    return notifs.filter(n => !n.userId || n.userId === loggedUser?._id);
  }

  if (endpoint.startsWith('/notifications/') && endpoint.endsWith('/read') && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const notifs = JSON.parse(localStorage.getItem('mock_notifications'));
    const idx = notifs.findIndex(n => n._id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      localStorage.setItem('mock_notifications', JSON.stringify(notifs));
      return notifs[idx];
    }
    throw new Error('Notification not found');
  }

  if (endpoint === '/notifications/read-all' && method === 'PUT') {
    const loggedUser = getLoggedInUser();
    const notifs = JSON.parse(localStorage.getItem('mock_notifications'));
    const updated = notifs.map(n => {
      if (!n.userId || n.userId === loggedUser?._id) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('mock_notifications', JSON.stringify(updated));
    return { success: true };
  }

  throw new Error(`Endpoint not mocked: ${endpoint}`);
};

const addNotification = (title, message, userId = null) => {
  const notifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
  notifs.unshift({
    _id: 'mock_notif_' + Date.now(),
    title,
    message,
    read: false,
    userId,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('mock_notifications', JSON.stringify(notifs));
};

window.api = api;

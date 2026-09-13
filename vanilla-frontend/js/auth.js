// Theme management (run immediately to avoid layout flashes)
(function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  // Trigger custom event so layout/navbar can sync icons if needed
  window.dispatchEvent(new Event('themechange'));
}

// Authentication & Session Management
const auth = {
  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },
  
  getToken: () => localStorage.getItem('token'),
  
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  updateUserProfile: (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
  },

  refreshUser: async () => {
    const token = auth.getToken();
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const freshUser = await response.json();
        auth.updateUserProfile(freshUser);
        return freshUser;
      } else {
        // Token expired/invalid, clear session
        auth.logout();
      }
    } catch (err) {
      console.error('Failed to auto-refresh user profile:', err);
    }
  },

  // Role routing guard
  checkPageAccess: () => {
    const pathname = window.location.pathname;
    const page = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
    const user = auth.getUser();
    const loggedIn = auth.isAuthenticated();

    // Guest-only pages
    const guestOnlyPages = ['login.html', 'register.html'];
    if (guestOnlyPages.includes(page) && loggedIn) {
      // Redirect to correct dashboard
      auth.redirectToDashboard(user.role);
      return;
    }

    if (page === 'index.html' || page === '') {
      return;
    }

    // Role-specific protected pages
    const protectedRoutes = {
      'citizen.html': ['citizen'],
      'report-waste.html': ['citizen'],
      'collector.html': ['collector'],
      'municipal.html': ['municipal'],
      'recycler.html': ['recycler'],
      'admin.html': ['admin'],
      'profile.html': ['citizen', 'collector', 'recycler', 'admin', 'municipal']
    };

    if (page in protectedRoutes) {
      if (!loggedIn) {
        window.location.href = 'login.html';
        return;
      }
      const allowedRoles = protectedRoutes[page];
      if (!allowedRoles.includes(user.role)) {
        // Unauthorized role, send to home page or their correct dashboard
        auth.redirectToDashboard(user.role);
      }
    }
  },

  redirectToDashboard: (role) => {
    switch (role) {
      case 'admin':
        window.location.href = 'admin.html';
        break;
      case 'municipal':
        window.location.href = 'municipal.html';
        break;
      case 'collector':
        window.location.href = 'collector.html';
        break;
      case 'recycler':
        window.location.href = 'recycler.html';
        break;
      case 'citizen':
      default:
        window.location.href = 'citizen.html';
    }
  }
};

// Check page access instantly upon script execution
auth.checkPageAccess();

window.auth = auth;
window.toggleTheme = toggleTheme;

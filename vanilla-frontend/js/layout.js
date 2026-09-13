document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  // Initialize Lucide Icons for injected components
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

let notifDropdownOpen = false;
let mobileMenuOpen = false;
let notifications = [];

async function renderNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const user = window.auth.getUser();
  const loggedIn = window.auth.isAuthenticated();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Define nav links based on role
  let navLinks = [];
  if (user) {
    switch (user.role) {
      case 'citizen':
        navLinks = [
          { name: 'Dashboard', path: 'citizen.html', icon: 'leaf' },
          { name: 'Report Plastic', path: 'report-waste.html', icon: 'map-pin' }
        ];
        break;
      case 'collector':
        navLinks = [
          { name: 'Collector Dashboard', path: 'collector.html', icon: 'leaf' }
        ];
        break;
      case 'recycler':
        navLinks = [
          { name: 'Recycler Dashboard', path: 'recycler.html', icon: 'recycle' }
        ];
        break;
      case 'admin':
        navLinks = [
          { name: 'Admin Control', path: 'admin.html', icon: 'bar-chart-3' }
        ];
        break;
      case 'municipal':
        navLinks = [
          { name: 'Municipal Control', path: 'municipal.html', icon: 'leaf' }
        ];
        break;
    }
  }

  // Check if current theme is dark
  const isDark = document.documentElement.classList.contains('dark');
  const themeTitle = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  const themeIcon = isDark 
    ? `<i data-lucide="sun" class="w-5 h-5 text-yellow-500 transition-transform hover:scale-110"></i>` 
    : `<i data-lucide="moon" class="w-5 h-5 text-slate-600 dark:text-slate-350 transition-transform hover:rotate-12"></i>`;

  // Desktop Links HTML
  const desktopLinksHtml = navLinks.map(link => {
    const active = currentPath === link.path;
    const activeClass = active 
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40';
    return `
      <a href="${link.path}" class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeClass}">
        <i data-lucide="${link.icon}" class="w-4 h-4"></i>
        <span>${link.name}</span>
      </a>
    `;
  }).join('');

  // User Actions HTML
  let userActionsHtml = '';
  if (loggedIn && user) {
    userActionsHtml = `
      <!-- Notifications -->
      <div class="relative" id="notif-dropdown-wrapper">
        <button id="notif-bell-btn" class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative">
          <i data-lucide="bell" class="w-5 h-5"></i>
          <span id="notif-badge" class="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold animate-bounce hidden">0</span>
        </button>
        
        <div id="notif-dropdown" class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 hidden animate-fadeIn">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">Alert Center</span>
            <button id="notif-read-all-btn" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1 hidden">
              <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
              <span>Read all</span>
            </button>
          </div>
          <div id="notif-list-container" class="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            <div class="p-6 text-center text-xs text-slate-400">Loading alerts...</div>
          </div>
        </div>
      </div>

      <!-- Profile Link -->
      <a href="profile.html" class="flex items-center space-x-2 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
        <img src="${user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}" alt="${user.name}" class="w-7 h-7 rounded-lg object-cover ring-2 ring-emerald-500/20" />
        <span class="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300">${user.name.split(' ')[0]}</span>
      </a>

      <!-- Logout -->
      <button id="logout-btn" class="hidden md:flex items-center space-x-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition" title="Logout">
        <i data-lucide="log-out" class="w-4 h-4"></i>
        <span>Logout</span>
      </button>
    `;
  } else {
    userActionsHtml = `
      <div class="hidden md:flex items-center space-x-3">
        <a href="login.html" class="text-slate-600 dark:text-slate-350 px-3 py-2 text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-400">Sign In</a>
        <a href="register.html" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Sign Up</a>
      </div>
    `;
  }

  container.className = "bg-white/80 dark:bg-slate-900/80 sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-all duration-200";
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="index.html" class="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500 font-extrabold text-2xl tracking-tight">
          <i data-lucide="leaf" class="w-8 h-8 text-emerald-500 animate-pulse"></i>
          <span class="font-sans">EcoCycle</span>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center space-x-6">
          ${desktopLinksHtml}
        </div>

        <!-- Actions & Utilities -->
        <div class="flex items-center space-x-4">
          <button id="theme-toggle-btn" class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200 focus:outline-none" title="${themeTitle}">
            ${themeIcon}
          </button>
          
          ${userActionsHtml}

          <!-- Mobile Hamburger -->
          <div class="md:hidden flex items-center">
            <button id="mobile-menu-toggle-btn" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 focus:outline-none">
              <i data-lucide="menu" class="w-6 h-6" id="mobile-menu-icon"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer Menu -->
    <div id="mobile-drawer" class="hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 shadow-lg">
      <!-- Mobile Links injected dynamically -->
    </div>
  `;

  // Bind Theme Toggle Click
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    window.toggleTheme();
  });

  // Re-sync icon on custom themechange event
  window.addEventListener('themechange', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      btn.innerHTML = isDark 
        ? `<i data-lucide="sun" class="w-5 h-5 text-yellow-500 transition-transform hover:scale-110"></i>` 
        : `<i data-lucide="moon" class="w-5 h-5 text-slate-600 dark:text-slate-350 transition-transform hover:rotate-12"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Bind Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle-btn');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileMenu);
  }

  // Bind Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => window.auth.logout());
  }

  // Setup Notifications & Dropdown listeners
  if (loggedIn) {
    setupNotifications();
  }
}

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  const drawer = document.getElementById('mobile-drawer');
  const icon = document.getElementById('mobile-menu-icon');
  
  if (!drawer) return;
  
  const user = window.auth.getUser();
  const loggedIn = window.auth.isAuthenticated();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  let navLinks = [];
  if (user) {
    switch (user.role) {
      case 'citizen':
        navLinks = [
          { name: 'Dashboard', path: 'citizen.html', icon: 'leaf' },
          { name: 'Report Plastic', path: 'report-waste.html', icon: 'map-pin' }
        ];
        break;
      case 'collector':
        navLinks = [
          { name: 'Collector Dashboard', path: 'collector.html', icon: 'leaf' }
        ];
        break;
      case 'recycler':
        navLinks = [
          { name: 'Recycler Dashboard', path: 'recycler.html', icon: 'recycle' }
        ];
        break;
      case 'admin':
        navLinks = [
          { name: 'Admin Control', path: 'admin.html', icon: 'bar-chart-3' }
        ];
        break;
    }
  }

  if (mobileMenuOpen) {
    drawer.classList.remove('hidden');
    icon.setAttribute('data-lucide', 'x');
    
    const linksHtml = navLinks.map(link => {
      const active = currentPath === link.path;
      const activeClass = active 
        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
      return `
        <a href="${link.path}" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-semibold ${activeClass}">
          <i data-lucide="${link.icon}" class="w-5 h-5"></i>
          <span>${link.name}</span>
        </a>
      `;
    }).join('');

    const actionsHtml = loggedIn && user ? `
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <a href="profile.html" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-350 font-semibold">
          <i data-lucide="user" class="w-5 h-5"></i>
          <span>My Profile</span>
        </a>
        <button id="mobile-logout-btn" class="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-red-600 dark:text-red-400 font-bold">
          <i data-lucide="log-out" class="w-5 h-5"></i>
          <span>Logout</span>
        </button>
      </div>
    ` : `
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
        <a href="login.html" class="text-center text-slate-600 dark:text-slate-350 py-2.5 font-semibold">Sign In</a>
        <a href="register.html" class="text-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl shadow-md">Sign Up</a>
      </div>
    `;

    drawer.innerHTML = linksHtml + actionsHtml;
    
    const mobLogout = document.getElementById('mobile-logout-btn');
    if (mobLogout) {
      mobLogout.addEventListener('click', () => window.auth.logout());
    }
  } else {
    drawer.classList.add('hidden');
    icon.setAttribute('data-lucide', 'menu');
  }
  
  if (window.lucide) window.lucide.createIcons();
}

function setupNotifications() {
  const bell = document.getElementById('notif-bell-btn');
  const dropdown = document.getElementById('notif-dropdown');
  const readAllBtn = document.getElementById('notif-read-all-btn');

  if (!bell || !dropdown) return;

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdownOpen = !notifDropdownOpen;
    if (notifDropdownOpen) {
      dropdown.classList.remove('hidden');
      loadNotifications();
    } else {
      dropdown.classList.add('hidden');
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== bell && !bell.contains(e.target)) {
      notifDropdownOpen = false;
      dropdown.classList.add('hidden');
    }
  });

  readAllBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await window.api.notifications.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  });

  // Fetch initial notifications
  fetchNotificationsCount();
  // Poll every 30s
  setInterval(fetchNotificationsCount, 30000);
}

async function fetchNotificationsCount() {
  try {
    const data = await window.api.notifications.getAll();
    notifications = data;
    const unread = data.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    const readAllBtn = document.getElementById('notif-read-all-btn');
    
    if (badge) {
      if (unread > 0) {
        badge.innerText = unread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    
    if (readAllBtn) {
      if (unread > 0) {
        readAllBtn.classList.remove('hidden');
      } else {
        readAllBtn.classList.add('hidden');
      }
    }
  } catch (err) {
    console.error('Failed to fetch notification badge count:', err);
  }
}

async function loadNotifications() {
  const container = document.getElementById('notif-list-container');
  if (!container) return;

  try {
    const data = await window.api.notifications.getAll();
    notifications = data;
    const unreadCount = data.filter(n => !n.read).length;
    
    const readAllBtn = document.getElementById('notif-read-all-btn');
    if (readAllBtn) {
      if (unreadCount > 0) readAllBtn.classList.remove('hidden');
      else readAllBtn.classList.add('hidden');
    }

    if (data.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No notifications to display.</div>`;
      return;
    }

    container.innerHTML = data.map(notif => {
      const formattedTime = new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div data-id="${notif._id}" class="notif-item p-3.5 text-xs text-left cursor-pointer transition ${
          notif.read 
            ? 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
            : 'bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 font-medium'
        }">
          <div class="flex justify-between items-start">
            <span class="font-semibold ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-emerald-700 dark:text-emerald-400'}">
              ${notif.title}
            </span>
            ${!notif.read ? `<span class="w-2 h-2 rounded-full bg-emerald-500 mt-1"></span>` : ''}
          </div>
          <p class="mt-1 text-[11px] leading-relaxed">${notif.message}</p>
          <span class="text-[10px] text-slate-400 mt-2 block">${formattedTime}</span>
        </div>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.getAttribute('data-id');
        const notif = notifications.find(n => n._id === id);
        if (notif && !notif.read) {
          try {
            await window.api.notifications.markAsRead(id);
            loadNotifications();
            fetchNotificationsCount();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-red-500 font-semibold">Failed to load alerts.</div>`;
  }
}

function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.className = "bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400";
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div class="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500 font-extrabold text-sm">
        <i data-lucide="leaf" class="w-4 h-4 text-emerald-500"></i>
        <span>EcoCycle Portal</span>
      </div>
      <p class="font-medium text-[11px] tracking-wide">
        © ${new Date().getFullYear()} EcoCycle. Helping citizens and collectors clean plastic waste together.
      </p>
      <div class="flex space-x-4 font-semibold text-[11px]">
        <a href="#" class="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Privacy</a>
        <a href="#" class="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Terms</a>
      </div>
    </div>
  `;
}

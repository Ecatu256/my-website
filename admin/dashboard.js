/**
 * Admin Dashboard JavaScript
 * Handles authentication, data loading, and dashboard functionality
 */

class AdminDashboard {
  constructor() {
    this.apiUrl = this.getApiUrl();
    this.token = localStorage.getItem('adminToken');
    this.currentPage = 1;
    this.currentMessageId = null;

    if (!this.token) {
      this.redirectToLogin();
    } else {
      this.init();
    }
  }

  getApiUrl() {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    return '/api';
  }

  init() {
    this.setupEventListeners();
    this.loadDashboardData();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => this.handleNavClick(e));
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.handleFilterChange(e.target.value);
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());

    // Message modal
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeMessageModal();
    });

    document.getElementById('statusSelect').addEventListener('change', (e) => {
      this.updateMessageStatus(e.target.value);
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
      this.deleteMessage();
    });

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('active');
    });
  }

  async loadDashboardData() {
    try {
      // Verify token
      const userResponse = await this.fetch('/admin/me');
      const userData = await userResponse.json();

      if (userData.success) {
        document.getElementById('userName').textContent = userData.data.username;
        document.getElementById('userEmail').textContent = userData.data.email;
      }

      // Load overview data
      this.loadOverview();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.redirectToLogin();
    }
  }

  async loadOverview() {
    try {
      const statsResponse = await this.fetch('/contact/stats/overview');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        const stats = statsData.data;
        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statUnread').textContent = stats.unread || 0;
        document.getElementById('statReplied').textContent = stats.replied || 0;
        document.getElementById('statArchived').textContent = stats.archived || 0;
        document.getElementById('unreadBadge').textContent = stats.unread || 0;
      }

      // Load analytics
      this.loadAnalytics();
    } catch (error) {
      console.error('Error loading overview:', error);
    }
  }

  async loadAnalytics() {
    try {
      // Daily stats
      const dailyResponse = await this.fetch('/analytics/daily?days=30');
      const dailyData = await dailyResponse.json();

      if (dailyData.success && document.getElementById('dailyChart')) {
        this.createChart('dailyChart', 'line', dailyData.data);
      }

      // Top domains
      const domainsResponse = await this.fetch('/analytics/domains?limit=10');
      const domainsData = await domainsResponse.json();

      if (domainsData.success) {
        this.displayTopDomains(domainsData.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async loadMessages(page = 1, status = null, search = null) {
    try {
      let url = `/contact?page=${page}&limit=10`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await this.fetch(url);
      const data = await response.json();

      if (data.success) {
        this.displayMessages(data.data);
        this.displayPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  displayMessages(messages) {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">No messages found</p>';
      return;
    }

    messages.forEach((msg) => {
      const initials = msg.name.split(' ').map((n) => n[0]).join('').toUpperCase();
      const date = new Date(msg.created_at).toLocaleDateString();

      const msgEl = document.createElement('div');
      msgEl.className = `message-item ${msg.status === 'unread' ? 'unread' : ''}`;
      msgEl.innerHTML = `
        <div class="message-avatar">${initials}</div>
        <div class="message-content">
          <div class="message-header">
            <div>
              <div class="message-from">${msg.name}</div>
              <div class="message-email">${msg.email}</div>
            </div>
            <div class="message-date">${date}</div>
          </div>
          <div class="message-subject">${msg.subject}</div>
        </div>
        <div class="message-status">
          <span class="status-badge ${msg.status}">${msg.status}</span>
        </div>
      `;

      msgEl.addEventListener('click', () => this.openMessageModal(msg.id));
      container.appendChild(msgEl);
    });
  }

  displayPagination(pagination) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    if (pagination.pages <= 1) return;

    for (let i = 1; i <= pagination.pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === pagination.page ? 'active' : '';
      btn.addEventListener('click', () => this.loadMessages(i));
      container.appendChild(btn);
    }
  }

  displayTopDomains(domains) {
    const container = document.getElementById('topDomains');
    container.innerHTML = '';

    domains.forEach((d) => {
      const el = document.createElement('div');
      el.className = 'domain-item';
      el.innerHTML = `
        <span class="domain-name">${d.domain}</span>
        <span class="domain-count">${d.count}</span>
      `;
      container.appendChild(el);
    });
  }

  async openMessageModal(messageId) {
    try {
      const response = await this.fetch(`/contact/${messageId}`);
      const data = await response.json();

      if (data.success) {
        const msg = data.data;
        this.currentMessageId = msg.id;

        document.getElementById('modalTitle').textContent = msg.subject;
        document.getElementById('modalStatus').textContent = msg.status;
        document.getElementById('modalStatus').className = `status-badge ${msg.status}`;
        document.getElementById('modalName').textContent = msg.name;
        document.getElementById('modalEmail').textContent = msg.email;
        document.getElementById('modalSubject').textContent = msg.subject;
        document.getElementById('modalDate').textContent = new Date(msg.created_at).toLocaleString();
        document.getElementById('modalMessage').textContent = msg.message;

        document.getElementById('messageModal').classList.add('active');
      }
    } catch (error) {
      console.error('Error loading message:', error);
    }
  }

  closeMessageModal() {
    document.getElementById('messageModal').classList.remove('active');
    this.currentMessageId = null;
  }

  async updateMessageStatus(status) {
    if (!this.currentMessageId || !status) return;

    try {
      const response = await this.fetch(`/contact/${this.currentMessageId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        this.showAlert('Message status updated', 'success');
        this.closeMessageModal();
        this.loadMessages(this.currentPage);
      }
    } catch (error) {
      this.showAlert('Error updating message status', 'error');
    }
  }

  async deleteMessage() {
    if (!this.currentMessageId) return;

    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await this.fetch(`/contact/${this.currentMessageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        this.showAlert('Message deleted', 'success');
        this.closeMessageModal();
        this.loadMessages(this.currentPage);
      }
    } catch (error) {
      this.showAlert('Error deleting message', 'error');
    }
  }

  async exportCSV() {
    try {
      const response = await this.fetch('/contact/export/csv');
      const csv = await response.text();

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      this.showAlert('Error exporting CSV', 'error');
    }
  }

  handleNavClick(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    document.querySelectorAll('.section').forEach((s) => {
      s.classList.remove('active');
    });

    const sectionEl = document.getElementById(section);
    if (sectionEl) {
      sectionEl.classList.add('active');
      document.getElementById('pageTitle').textContent = e.currentTarget.textContent.trim().split('\n')[0];

      if (section === 'messages') {
        this.loadMessages();
      }
    }
  }

  handleSearch(value) {
    this.loadMessages(1, null, value);
  }

  handleFilterChange(status) {
    this.loadMessages(1, status);
  }

  showAlert(message, type = 'success') {
    const alertEl = type === 'success' ? document.getElementById('successAlert') : document.getElementById('alertError');
    alertEl.textContent = message;
    alertEl.style.display = 'block';
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 5000);
  }

  createChart(canvasId, type, data) {
    // Simplified chart creation
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = data.map((d) => d.date || d.week || d.month);
    const values = data.map((d) => d.count);

    new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: 'Count',
            data: values,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
      },
    });
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };

    const response = await window.fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (response.status === 401) {
      this.redirectToLogin();
    }

    return response;
  }

  logout() {
    localStorage.removeItem('adminToken');
    this.redirectToLogin();
  }

  redirectToLogin() {
    window.location.href = 'login.html';
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});

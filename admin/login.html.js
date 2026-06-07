/**
 * Admin login JavaScript
 * Handles authentication and login
 */

class AdminLogin {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.apiUrl = this.getApiUrl();
    this.init();
  }

  getApiUrl() {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    return '/api';
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Check if already logged in
    if (localStorage.getItem('adminToken')) {
      window.location.href = 'dashboard.html';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Clear previous errors
    this.clearErrors();

    if (!this.validateForm(username, password)) {
      return;
    }

    // Show loading
    const btn = document.getElementById('loginBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.add('active');

    try {
      const response = await fetch(`${this.apiUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('adminToken', data.data.token);

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        this.showError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('An error occurred. Please try again.');
    } finally {
      btn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.remove('active');
    }
  }

  validateForm(username, password) {
    let isValid = true;

    if (!username) {
      this.setFieldError('username', 'Username is required');
      isValid = false;
    }

    if (!password) {
      this.setFieldError('password', 'Password is required');
      isValid = false;
    }

    return isValid;
  }

  setFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorEl = document.getElementById(`${fieldName}Error`);
    const formGroup = field.closest('.form-group');

    formGroup.classList.add('error');
    errorEl.textContent = message;
  }

  clearErrors() {
    document.querySelectorAll('.form-group.error').forEach((group) => {
      group.classList.remove('error');
      group.querySelector('.error-message').textContent = '';
    });
  }

  showError(message) {
    const alertEl = document.getElementById('errorAlert');
    const messageEl = document.getElementById('errorMessage');
    messageEl.textContent = message;
    alertEl.style.display = 'block';
  }
}

// Initialize login
document.addEventListener('DOMContentLoaded', () => {
  new AdminLogin();
});

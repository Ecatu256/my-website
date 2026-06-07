/**
 * Frontend contact form JavaScript
 * Handles form validation, submission, and error handling
 */

class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.successAlert = document.getElementById('successAlert');
    this.errorAlert = document.getElementById('errorAlert');
    this.charCount = document.getElementById('charCount');
    this.messageField = document.getElementById('message');
    this.apiEndpoint = this.getApiEndpoint();

    this.init();
  }

  init() {
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Character counter
    this.messageField.addEventListener('input', () => this.updateCharCount());

    // Hide alerts on input
    ['name', 'email', 'subject', 'message'].forEach((fieldName) => {
      document.getElementById(fieldName).addEventListener('input', () => {
        this.clearErrors(fieldName);
      });
    });
  }

  /**
   * Determine API endpoint
   */
  getApiEndpoint() {
    // In development, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api/contact';
    }
    // In production, use same domain
    return `${window.location.origin}/api/contact`;
  }

  /**
   * Validate form data
   */
  validateForm() {
    const errors = {};
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    const honeypot = document.querySelector('input[name="honeypot"]').value;

    // Check honeypot
    if (honeypot) {
      console.warn('Honeypot field filled - likely spam');
      return { honeypot: 'Invalid submission' };
    }

    // Validate name
    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length < 2 || name.length > 100) {
      errors.name = 'Name must be between 2 and 100 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      errors.name = 'Name can only contain letters and spaces';
    }

    // Validate email
    if (!email) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Please provide a valid email address';
    }

    // Validate subject
    if (!subject) {
      errors.subject = 'Subject is required';
    } else if (subject.length < 3 || subject.length > 200) {
      errors.subject = 'Subject must be between 3 and 200 characters';
    }

    // Validate message
    if (!message) {
      errors.message = 'Message is required';
    } else if (message.length < 10 || message.length > 5000) {
      errors.message = 'Message must be between 10 and 5000 characters';
    }

    return errors;
  }

  /**
   * Email validation
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Update character count
   */
  updateCharCount() {
    const count = this.messageField.value.length;
    this.charCount.textContent = count;
  }

  /**
   * Clear error for field
   */
  clearErrors(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}Error`);
    const formGroup = field.closest('.form-group');

    formGroup?.classList.remove('error');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Display validation errors
   */
  displayErrors(errors) {
    Object.keys(errors).forEach((fieldName) => {
      const field = document.getElementById(fieldName);
      if (field) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const formGroup = field.closest('.form-group');

        formGroup?.classList.add('error');
        if (errorElement) {
          errorElement.textContent = errors[fieldName];
        }
      }
    });
  }

  /**
   * Show success message
   */
  showSuccess(messageId) {
    this.form.style.display = 'none';
    this.successAlert.style.display = 'block';
    document.getElementById('referenceId').textContent = `Reference ID: ${messageId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Show error message
   */
  showError(message) {
    this.errorAlert.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Hide alerts
   */
  hideAlerts() {
    this.successAlert.style.display = 'none';
    this.errorAlert.style.display = 'none';
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    // Hide previous alerts
    this.hideAlerts();

    // Validate
    const errors = this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.displayErrors(errors);
      return;
    }

    // Disable submit button and show loader
    this.submitBtn.disabled = true;
    const btnText = this.submitBtn.querySelector('.btn-text');
    const btnLoader = this.submitBtn.querySelector('.btn-loader');
    btnText.classList.add('hidden');
    btnLoader.classList.add('active');

    try {
      // Prepare form data
      const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
        honeypot: document.querySelector('input[name="honeypot"]').value,
      };

      // Send request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        this.showSuccess(data.data.id);
        this.form.reset();
        this.updateCharCount();
      } else {
        // API error
        const errorMessage = data.message || 'Failed to send message. Please try again.';
        this.showError(errorMessage);

        // Display field errors if any
        if (data.errors) {
          this.displayErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      this.showError(
        'Failed to send message. Please check your internet connection and try again.'
      );
    } finally {
      // Re-enable submit button
      this.submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.remove('active');
    }
  }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
});

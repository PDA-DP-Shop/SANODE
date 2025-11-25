const AUTH_KEY = 'sanodeAuthToken';
const VALID_USERNAME = 'SANODE';
const VALID_PASSWORD = '@SANODE';

const loginForm = document.querySelector('#loginForm');
const errorEl = document.querySelector('[data-error]');

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
          loggedIn: true,
          timestamp: Date.now(),
        })
      );
      window.location.href = 'dashboard.html';
      return;
    }

    if (errorEl) {
      errorEl.textContent = 'Invalid credentials. Please try again.';
    }
  });
}






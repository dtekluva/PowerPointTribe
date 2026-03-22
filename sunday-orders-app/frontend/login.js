// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token is still valid
        verifyToken(token);
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideError();

        try {
            const apiBase = '/api';

            const response = await fetch(`${apiBase}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userInfo', JSON.stringify({
                    user_id: data.user_id,
                    username: data.username,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email
                }));

                if (rememberMe) {
                    localStorage.setItem('rememberLogin', 'true');
                }

                // Show success message briefly
                showSuccess('Login successful! Redirecting...');

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } else {
                // Login failed
                showError(data.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Verify token validity
    async function verifyToken(token) {
        try {
            const apiBase = '/api';
            const response = await fetch(`${apiBase}/auth/profile/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Token is valid, redirect to dashboard
                window.location.href = 'index.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                localStorage.removeItem('userInfo');
            }
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
        }
    }

    // Set loading state
    function setLoadingState(loading) {
        loginBtn.disabled = loading;
        if (loading) {
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-block';
        } else {
            btnText.style.display = 'inline-block';
            btnSpinner.style.display = 'none';
        }
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.style.background = '#fed7d7';
        errorMessage.style.color = '#c53030';
        errorMessage.style.borderColor = '#feb2b2';
    }

    // Show success message
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.style.background = '#c6f6d5';
        errorMessage.style.color = '#2f855a';
        errorMessage.style.borderColor = '#9ae6b4';
    }

    // Hide error/success message
    function hideError() {
        errorMessage.style.display = 'none';
    }
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

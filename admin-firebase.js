// Firebase version - stores data in Firebase instead of localStorage
let books = [];
let isAdmin = false;

// DOM elements
const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const addBookForm = document.getElementById('addBookForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const booksList = document.getElementById('booksList');
const logoutBtn = document.getElementById('logoutBtn');
const messageModal = document.getElementById('messageModal');
const closeMessage = document.querySelector('.close-message');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthStatus();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Add book form
    addBookForm.addEventListener('submit', handleAddBook);
    
    // Change password form
    changePasswordForm.addEventListener('submit', handleChangePassword);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Message modal close
    closeMessage.addEventListener('click', function() {
        messageModal.style.display = 'none';
    });
    
    // Close message modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === messageModal) {
            messageModal.style.display = 'none';
        }
    });
}

// Check authentication status
function checkAuthStatus() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        showAdminDashboard();
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    try {
        // Get admin password from Firebase
        const doc = await db.collection('admin').doc('settings').get();
        const adminData = doc.data();
        
        if (adminData && adminData.password === password) {
            // Store session
            localStorage.setItem('adminSession', 'true');
            isAdmin = true;
            showAdminDashboard();
            showMessage('چوونەژوورەوە سەرکەوتوو بوو!', 'success');
        } else {
            loginError.textContent = 'وشەی نهێنی هەڵەیە!';
            loginError.style.display = 'block';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'هەڵە لە چوونەژوورەوە: ' + error.message;
        loginError.style.display = 'block';
    }
}

// Show admin dashboard
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadBooks(); // updateStats will be called inside loadBooks after books are loaded
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('adminSession');
    isAdmin = false;
    loginSection.style.display = 'flex';
    adminDashboard.style.display = 'none';
    loginForm.reset();
    showMessage('دەرچوون سەرکەوتوو بوو!', 'success');
}

// Load books from Firebase
async function loadBooks() {
    try {
        const querySnapshot = await db.collection('books').get();
        books = [];
        querySnapshot.forEach((doc) => {
            books.push({
                id: doc.id,
                ...doc.data()
            });
        });
        displayBooks();
        updateStats(); // Update statistics after loading books
    } catch (error) {
        console.error('Error loading books:', error);
        showMessage('هەڵە لە هێنانی کتێبەکان: ' + error.message, 'error');
    }
}

// Display books in admin panel
function displayBooks() {
    if (books.length === 0) {
        booksList.innerHTML = '<div class="empty-state"><h3>هیچ کتێبێک نییە</h3><p>دەست پێ بکە بە زیادکردنی کتێبی نوێ</p></div>';
        return;
    }

    booksList.innerHTML = books.map(book => `
        <div class="book-item">
            <div class="book-info">
                <h4>${book.name || 'بێ ناو'}</h4>
                <p>نوسەر: ${book.author || 'نەزانراو'}</p>
                <p>جۆر: ${book.type || 'بێ جۆر'}</p>
            </div>
            <div class="book-actions">
                <button class="edit-btn" onclick="goToDashboard('${book.id}')">دەستکاری</button>
                <button class="delete-btn" onclick="deleteBook('${book.id}')">سڕینەوە</button>
            </div>
        </div>
    `).join('');
}

// Go to dashboard for editing
function goToDashboard(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    console.log('Going to dashboard for book:', bookId, book); // Debug

    // Fill form with book data
    document.getElementById('bookName').value = book.name || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookType').value = book.type || '';
    document.getElementById('bookDesc').value = book.desc || '';
    document.getElementById('bookLink').value = book.link || '';
    
    // Store editing book ID
    const editingBookId = document.getElementById('editingBookId');
    if (editingBookId) {
        editingBookId.value = bookId;
    }
    
    // Change form title
    const formSection = document.querySelector('.form-section h2');
    if (formSection) {
        formSection.textContent = 'دەستکاریکردنی کتێب';
    }
    
    // Change submit button
    const submitBtn = document.querySelector('#addBookForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'نوێکردنەوەی کتێب';
    }
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    showMessage('فرمەی دەستکاریکردن پڕکراەتەوە. دەتوانی زانیارییەکان بگۆڕیت.', 'success');
}

// Handle add/edit book
async function handleAddBook(e) {
    e.preventDefault();
    
    // Check if we're editing an existing book
    const editingBookId = document.getElementById('editingBookId');
    const isEditing = editingBookId && editingBookId.value;
    
    const formData = new FormData(addBookForm);
    const bookData = {
        name: formData.get('name'),
        author: formData.get('author'),
        type: formData.get('type'),
        desc: formData.get('desc') || '',
        link: formData.get('link') || '',
        updatedAt: new Date().toISOString()
    };

    try {
        if (isEditing) {
            // Update existing book
            await db.collection('books').doc(editingBookId.value).update(bookData);
            showMessage('کتێبەکە بە سەرکەوتوویی نوێکرایەوە', 'success');
            
            // Reset form to add mode
            const formSection = document.querySelector('.form-section h2');
            if (formSection) {
                formSection.textContent = 'زیادکردنی کتێبی نوێ';
            }
            
            const submitBtn = document.querySelector('#addBookForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'زیادکردنی کتێب';
            }
            
            editingBookId.value = '';
        } else {
            // Add new book
            bookData.createdAt = new Date().toISOString();
            await db.collection('books').add(bookData);
            showMessage('کتێب بە سەرکەوتوویی زیادکرا!', 'success');
        }
        
        addBookForm.reset();
        loadBooks(); // updateStats will be called inside loadBooks
    } catch (error) {
        console.error('Error saving book:', error);
        showMessage('هەڵە لە پاشکەوتکردنی کتێب: ' + error.message, 'error');
    }
}

// Edit book (placeholder for future enhancement)
function editBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Fill form with book data
    document.getElementById('bookName').value = book.name || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookType').value = book.type || '';
    document.getElementById('bookDesc').value = book.desc || '';
    document.getElementById('bookLink').value = book.link || '';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    showMessage('فرمە پڕکراەتەوە بە زانیارییەکانی کتێب. دەتوانی بیگۆڕیت و دووبارە پێشکەشی بکەیت.', 'success');
}

// Delete book
async function deleteBook(bookId) {
    if (!confirm('ئایا دڵنیای لە سڕینەوەی ئەم کتێبە؟')) {
        return;
    }

    try {
        await db.collection('books').doc(bookId).delete();
        loadBooks(); // updateStats will be called inside loadBooks
        showMessage('کتێب بە سەرکەوتوویی سڕایەوە!', 'success');
    } catch (error) {
        console.error('Error deleting book:', error);
        showMessage('هەڵە لە سڕینەوەی کتێب: ' + error.message, 'error');
    }
}

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (newPassword !== confirmPassword) {
        showMessage('وشەی نهێنی نوێ وەک یەک نییە!', 'error');
        return;
    }

    if (newPassword.length < 4) {
        showMessage('وشەی نهێنی دەبێت لە 4 پیت زیاتر بێت!', 'error');
        return;
    }

    try {
        // Verify current password
        const doc = await db.collection('admin').doc('settings').get();
        const adminData = doc.data();
        
        if (adminData && adminData.password === currentPassword) {
            // Update password
            await db.collection('admin').doc('settings').update({
                password: newPassword,
                updatedAt: new Date().toISOString()
            });
            
            changePasswordForm.reset();
            showMessage('وشەی نهێنی بە سەرکەوتوویی گۆڕدرا!', 'success');
        } else {
            showMessage('وشەی نهێنی ئێستا هەڵەیە!', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('هەڵە لە گۆڕینی وشەی نهێنی: ' + error.message, 'error');
    }
}

// Update statistics
function updateStats() {
    console.log('updateStats called, books.length:', books.length); // Debug
    
    const totalBooksEl = document.getElementById('totalBooks');
    const lastAddedEl = document.getElementById('lastAdded');
    
    console.log('totalBooksEl:', totalBooksEl); // Debug
    console.log('lastAddedEl:', lastAddedEl); // Debug
    
    if (totalBooksEl) {
        totalBooksEl.textContent = books.length;
        console.log('Set totalBooks to:', books.length); // Debug
    } else {
        console.error('totalBooks element not found!'); // Debug
    }
    
    if (books.length > 0) {
        // Find the most recently added book
        const latestBook = books.reduce((latest, book) => {
            return (!latest || new Date(book.createdAt) > new Date(latest.createdAt)) ? book : latest;
        });
        
        if (lastAddedEl) {
            lastAddedEl.textContent = latestBook.name || 'بێ ناو';
        }
    } else {
        if (lastAddedEl) {
            lastAddedEl.textContent = 'هیچ';
        }
    }
}

// Show message modal
function showMessage(message, type) {
    const messageText = document.getElementById('messageText');
    const messageContent = messageModal.querySelector('.message-content');
    
    messageText.textContent = message;
    messageContent.className = 'message-content ' + type;
    messageModal.style.display = 'flex';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        messageModal.style.display = 'none';
    }, 3000);
}

// Real-time listener for books changes (disabled for testing)
function setupRealtimeListener() {
    console.log('Realtime listener disabled for testing');
    // Comment out for now
    /*
    db.collection('books').onSnapshot((snapshot) => {
        books = [];
        snapshot.forEach(doc => {
            books.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayBooks();
        updateStats();
    }, (error) => {
        console.error('Realtime listener error:', error);
    });
    */
}

// Setup realtime listener when admin dashboard is shown
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    setupRealtimeListener();
    loadBooks();
    updateStats();
}

// Export functions for global access
window.editBook = editBook;
window.deleteBook = deleteBook;
window.showMessage = showMessage;

// Firebase version - loads from Firebase instead of localStorage
let books = [];
let currentFilter = 'all';

// DOM elements
const booksGrid = document.getElementById('booksGrid');
const modal = document.getElementById('bookModal');
const closeModal = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadBooks();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    // Modal close
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Load books from Firebase
async function loadBooks() {
    try {
        showLoading();
        const snapshot = await db.collection('books').get();
        books = [];
        
        snapshot.forEach(doc => {
            books.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        showError('هەڵە لە هێنانی کتێبەکان: ' + error.message);
    }
}

// Display books
function displayBooks(booksToDisplay) {
    if (booksToDisplay.length === 0) {
        booksGrid.innerHTML = '<div class="error">هیچ کتێبێک نەدۆزرایەوە. بچۆ بە بەشی بەڕێوبەر بۆ زیادکردنی کتێب.</div>';
        return;
    }

    booksGrid.innerHTML = booksToDisplay.map((book, index) => `
        <div class="book-card" onclick="showBookDetails('${book.id}')">
            <h3 class="book-title">${book.name || 'بێ ناو'}</h3>
            <p class="book-author">نوسەر: ${book.author || 'نەزانراو'}</p>
            <span class="book-type">${book.type || 'بێ جۆر'}</span>
            <button class="book-details-btn">بینینی وردەکاری</button>
        </div>
    `).join('');
}

// Filter books
function filterBooks(type) {
    currentFilter = type;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.trim() === type || (type === 'all' && btn.textContent.trim() === 'هەمووی')) {
            btn.classList.add('active');
        }
    });

    // Filter books
    let filteredBooks = books;
    if (type !== 'all') {
        filteredBooks = books.filter(book => book.type === type);
    }

    displayBooks(filteredBooks);
}

// Show book details
function showBookDetails(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Fill modal with book details
    document.getElementById('modalBookTitle').textContent = book.name || 'بێ ناو';
    document.getElementById('modalBookType').textContent = book.type || 'بێ جۆر';
    document.getElementById('modalBookAuthor').textContent = book.author || 'نەزانراو';
    document.getElementById('modalBookDesc').textContent = book.desc || 'هیچ وەسفێک نییە';
    
    const linkButton = document.getElementById('modalBookLink');
    if (book.link && book.link.trim() !== '') {
        linkButton.href = book.link;
        linkButton.style.display = 'inline-block';
        linkButton.target = '_blank';
        linkButton.onclick = function(e) {
            e.preventDefault();
            window.open(book.link, '_blank');
        };
    } else {
        linkButton.style.display = 'none';
    }

    // Show modal
    modal.style.display = 'block';
}

// Show loading state
function showLoading() {
    booksGrid.innerHTML = '<div class="loading">...چاوەڕێی هێنانی کتێبەکان</div>';
}

// Show error state
function showError(message) {
    booksGrid.innerHTML = `<div class="error">${message}</div>`;
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
        
        // Re-apply current filter
        if (currentFilter !== 'all') {
            filterBooks(currentFilter);
        } else {
            displayBooks(books);
        }
    }, (error) => {
        console.error('Realtime listener error:', error);
    });
    */
}

// Setup realtime listener when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupRealtimeListener();
});

// Export functions for global access
window.showSection = showSection;
window.filterBooks = filterBooks;
window.showBookDetails = showBookDetails;

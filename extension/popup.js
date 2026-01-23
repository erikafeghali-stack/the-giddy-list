// The Giddy List Chrome Extension - Popup Script

const API_BASE = 'https://thegiddylist.com';

// State
let currentProduct = null;
let kids = [];
let isLoggedIn = false;

// DOM Elements
const loadingState = document.getElementById('loading');
const notLoggedInState = document.getElementById('not-logged-in');
const noKidsState = document.getElementById('no-kids');
const scrapeFailedState = document.getElementById('scrape-failed');
const productView = document.getElementById('product-view');
const productImage = document.getElementById('product-image');
const productTitle = document.getElementById('product-title');
const productPrice = document.getElementById('product-price');
const productDomain = document.getElementById('product-domain');
const kidSelect = document.getElementById('kid-select');
const addBtn = document.getElementById('add-btn');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Initialize popup
document.addEventListener('DOMContentLoaded', init);

async function init() {
  showState('loading');

  try {
    // Check auth status
    const authData = await checkAuth();

    if (!authData.isLoggedIn) {
      showState('not-logged-in');
      return;
    }

    isLoggedIn = true;
    kids = authData.kids || [];

    // Check if user has kids
    if (kids.length === 0) {
      showState('no-kids');
      return;
    }

    // Populate kids dropdown
    populateKidsDropdown();

    // Scrape product from current tab
    const product = await scrapeCurrentTab();

    if (!product || !product.title) {
      showState('scrape-failed');
      return;
    }

    currentProduct = product;
    displayProduct(product);
    showState('product-view');

  } catch (error) {
    console.error('Init error:', error);
    showState('scrape-failed');
  }
}

// Check authentication status
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/api/extension/auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { isLoggedIn: false, kids: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth check error:', error);
    return { isLoggedIn: false, kids: [] };
  }
}

// Scrape product from current tab
async function scrapeCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        resolve(null);
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeProduct' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Scrape error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        resolve(response);
      });
    });
  });
}

// Populate kids dropdown
function populateKidsDropdown() {
  kidSelect.innerHTML = '<option value="">Select a kid...</option>';

  kids.forEach(kid => {
    const option = document.createElement('option');
    option.value = kid.id;
    option.textContent = kid.name;
    kidSelect.appendChild(option);
  });
}

// Display product info
function displayProduct(product) {
  // Set image
  if (product.image) {
    productImage.src = product.image;
    productImage.onerror = () => {
      productImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
    };
  } else {
    productImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
  }

  // Set title
  productTitle.textContent = product.title || 'Unknown Product';

  // Set price
  if (product.price) {
    productPrice.textContent = '$' + product.price;
    productPrice.style.display = 'block';
  } else {
    productPrice.style.display = 'none';
  }

  // Set domain
  if (product.domain) {
    productDomain.textContent = product.domain.replace('www.', '');
  }
}

// Show specific state
function showState(stateName) {
  // Hide all states
  loadingState.classList.add('hidden');
  notLoggedInState.classList.add('hidden');
  noKidsState.classList.add('hidden');
  scrapeFailedState.classList.add('hidden');
  productView.classList.add('hidden');

  // Show requested state
  switch (stateName) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'not-logged-in':
      notLoggedInState.classList.remove('hidden');
      break;
    case 'no-kids':
      noKidsState.classList.remove('hidden');
      break;
    case 'scrape-failed':
      scrapeFailedState.classList.remove('hidden');
      break;
    case 'product-view':
      productView.classList.remove('hidden');
      break;
  }
}

// Handle kid selection
kidSelect.addEventListener('change', () => {
  addBtn.disabled = !kidSelect.value;
  hideMessages();
});

// Handle add button click
addBtn.addEventListener('click', addToWishlist);

async function addToWishlist() {
  if (!currentProduct || !kidSelect.value) return;

  const kidId = kidSelect.value;

  // Show loading state
  addBtn.disabled = true;
  addBtn.classList.add('adding');
  addBtn.textContent = 'Adding...';
  hideMessages();

  try {
    const response = await fetch(`${API_BASE}/api/wishlist/add-external`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kidId: kidId,
        title: currentProduct.title,
        image: currentProduct.image,
        price: currentProduct.price,
        url: currentProduct.url
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add item');
    }

    // Show success
    successMessage.classList.remove('hidden');
    addBtn.textContent = 'Added!';
    addBtn.classList.remove('adding');

    // Reset after delay
    setTimeout(() => {
      addBtn.textContent = 'Add to Wishlist';
      addBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Add error:', error);
    errorText.textContent = error.message || 'Something went wrong';
    errorMessage.classList.remove('hidden');
    addBtn.textContent = 'Add to Wishlist';
    addBtn.classList.remove('adding');
    addBtn.disabled = false;
  }
}

function hideMessages() {
  successMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

// The Giddy List Chrome Extension - Popup Script

const API_BASE = 'https://thegiddylist.com';

// State
let currentProduct = null;
let kids = [];
let registries = [];
let isLoggedIn = false;
let authToken = null;
let currentDestination = 'wishlist'; // 'wishlist' or 'registry'

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
const registrySelect = document.getElementById('registry-select');
const wishlistSection = document.getElementById('wishlist-section');
const registrySection = document.getElementById('registry-section');
const noRegistriesMsg = document.getElementById('no-registries-msg');
const tabWishlist = document.getElementById('tab-wishlist');
const tabRegistry = document.getElementById('tab-registry');
const addBtn = document.getElementById('add-btn');
const successMessage = document.getElementById('success-message');
const successText = document.getElementById('success-text');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Initialize popup
document.addEventListener('DOMContentLoaded', init);

async function init() {
  showState('loading');

  try {
    // Get auth token from cookies
    authToken = await getAuthToken();

    if (!authToken) {
      showState('not-logged-in');
      return;
    }

    // Check auth status and get kids + registries
    const authData = await checkAuth(authToken);

    if (!authData.isLoggedIn) {
      showState('not-logged-in');
      return;
    }

    isLoggedIn = true;
    kids = authData.kids || [];
    registries = authData.registries || [];

    // Check if user has kids
    if (kids.length === 0) {
      showState('no-kids');
      return;
    }

    // Populate dropdowns
    populateKidsDropdown();
    populateRegistryDropdown();

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

// Get Supabase auth token from cookies
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: 'thegiddylist.com' }, (cookies) => {
      // Look for Supabase auth cookies
      const authCookie = cookies.find(c =>
        c.name.includes('auth-token') ||
        c.name.includes('access-token') ||
        c.name.startsWith('sb-') && c.name.includes('auth')
      );

      if (authCookie) {
        resolve(authCookie.value);
        return;
      }

      // Also check for base64 encoded session
      const sessionCookie = cookies.find(c =>
        c.name.includes('session') ||
        (c.name.startsWith('sb-') && c.value.length > 100)
      );

      if (sessionCookie) {
        resolve(sessionCookie.value);
        return;
      }

      console.log('Available cookies:', cookies.map(c => c.name));
      resolve(null);
    });
  });
}

// Check authentication status
async function checkAuth(token) {
  try {
    const response = await fetch(`${API_BASE}/api/extension/auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return { isLoggedIn: false, kids: [], registries: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth check error:', error);
    return { isLoggedIn: false, kids: [], registries: [] };
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

// Populate registry dropdown
function populateRegistryDropdown() {
  registrySelect.innerHTML = '<option value="">Select a registry...</option>';

  if (registries.length === 0) {
    noRegistriesMsg.classList.remove('hidden');
    return;
  }

  noRegistriesMsg.classList.add('hidden');

  registries.forEach(reg => {
    const option = document.createElement('option');
    option.value = reg.id;
    const label = reg.occasion ? `${reg.name} (${reg.occasion})` : reg.name;
    option.textContent = label;
    registrySelect.appendChild(option);
  });
}

// Display product info
function displayProduct(product) {
  if (product.image) {
    productImage.src = product.image;
    productImage.onerror = () => {
      productImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
    };
  } else {
    productImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
  }

  productTitle.textContent = product.title || 'Unknown Product';

  if (product.price) {
    productPrice.textContent = '$' + product.price;
    productPrice.style.display = 'block';
  } else {
    productPrice.style.display = 'none';
  }

  if (product.domain) {
    productDomain.textContent = product.domain.replace('www.', '');
  }
}

// Show specific state
function showState(stateName) {
  loadingState.classList.add('hidden');
  notLoggedInState.classList.add('hidden');
  noKidsState.classList.add('hidden');
  scrapeFailedState.classList.add('hidden');
  productView.classList.add('hidden');

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

// Switch between wishlist and registry tabs
function switchDestination(dest) {
  currentDestination = dest;
  hideMessages();

  // Update tab styles
  tabWishlist.classList.toggle('active', dest === 'wishlist');
  tabRegistry.classList.toggle('active', dest === 'registry');

  // Show/hide sections
  if (dest === 'wishlist') {
    wishlistSection.classList.remove('hidden');
    registrySection.classList.add('hidden');
    addBtn.textContent = 'Add to Wishlist';
    addBtn.disabled = !kidSelect.value;
  } else {
    wishlistSection.classList.add('hidden');
    registrySection.classList.remove('hidden');
    addBtn.textContent = 'Add to Registry';
    addBtn.disabled = !registrySelect.value;
  }
}

// Tab click handlers
tabWishlist.addEventListener('click', () => switchDestination('wishlist'));
tabRegistry.addEventListener('click', () => switchDestination('registry'));

// Handle selections
kidSelect.addEventListener('change', () => {
  if (currentDestination === 'wishlist') {
    addBtn.disabled = !kidSelect.value;
  }
  hideMessages();
});

registrySelect.addEventListener('change', () => {
  if (currentDestination === 'registry') {
    addBtn.disabled = !registrySelect.value;
  }
  hideMessages();
});

// Handle add button click
addBtn.addEventListener('click', addItem);

async function addItem() {
  if (!currentProduct) return;

  const isWishlist = currentDestination === 'wishlist';

  if (isWishlist && !kidSelect.value) return;
  if (!isWishlist && !registrySelect.value) return;

  // Show loading state
  addBtn.disabled = true;
  addBtn.classList.add('adding');
  addBtn.textContent = 'Adding...';
  hideMessages();

  try {
    const payload = {
      title: currentProduct.title,
      image: currentProduct.image,
      price: currentProduct.price,
      url: currentProduct.url,
    };

    if (isWishlist) {
      payload.kidId = kidSelect.value;
    } else {
      payload.registryId = registrySelect.value;
    }

    const response = await fetch(`${API_BASE}/api/wishlist/add-external`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add item');
    }

    // Show success
    successText.textContent = data.message || (isWishlist ? 'Added to wishlist!' : 'Added to registry!');
    successMessage.classList.remove('hidden');
    addBtn.textContent = 'Added!';
    addBtn.classList.remove('adding');

    // Reset after delay
    setTimeout(() => {
      addBtn.textContent = isWishlist ? 'Add to Wishlist' : 'Add to Registry';
      addBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Add error:', error);
    errorText.textContent = error.message || 'Something went wrong';
    errorMessage.classList.remove('hidden');
    addBtn.textContent = isWishlist ? 'Add to Wishlist' : 'Add to Registry';
    addBtn.classList.remove('adding');
    addBtn.disabled = false;
  }
}

function hideMessages() {
  successMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

const AUTH_KEY = 'sanodeAuthToken';
const CUSTOM_PRODUCTS_KEY = 'sanodeCustomProducts';
const COUNTRIES = ['india', 'uae', 'kenya', 'usa'];
const FORMS = ['capsule', 'tablet', 'powder'];

const requireAuth = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    if (!stored?.loggedIn) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
};

requireAuth();

const logoutBtn = document.querySelector('#logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  });
}

const productForm = document.querySelector('#productForm');
const statusEl = document.querySelector('[data-status]');
const listEl = document.querySelector('#productList');
const imageInput = document.querySelector('#productImage');
const emptyStateEl = document.querySelector('[data-empty]');
const bulkExportBtn = document.querySelector('#bulkExportBtn');

const showStatus = (message, persist = false) => {
  if (!statusEl) return;
  statusEl.textContent = message;
  if (!persist) {
    setTimeout(() => {
      if (statusEl.textContent === message) statusEl.textContent = '';
    }, 4000);
  }
};

const loadProducts = () => {
  try {
    const data = JSON.parse(localStorage.getItem(CUSTOM_PRODUCTS_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Unable to load products', error);
    return [];
  }
};

let customProducts = loadProducts();
let editingProductId = null;
let editingImageData = null;

const saveProducts = () => {
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
};

const dataURLFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const setImageRequired = (required) => {
  if (!imageInput) return;
  if (required) {
    imageInput.setAttribute('required', 'required');
  } else {
    imageInput.removeAttribute('required');
  }
};

const populatePriceInputs = (prices = {}) => {
  if (!productForm) return;
  COUNTRIES.forEach((country) => {
    FORMS.forEach((form) => {
      const input = productForm.querySelector(`[name="price-${country}-${form}"]`);
      if (input) {
        input.value = prices[country]?.[form] ?? '';
      }
    });
  });
};

const resetFormState = () => {
  if (!productForm) return;
  productForm.reset();
  editingProductId = null;
  editingImageData = null;
  setImageRequired(true);
  const submitBtn = productForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Save Product';
  if (statusEl) statusEl.textContent = '';
};

const startEditingProduct = (productId) => {
  if (!productForm) return;
  const product = customProducts.find((item) => item.id === productId);
  if (!product) return;

  editingProductId = product.id;
  editingImageData = product.imageData;

  productForm.querySelector('#productName').value = product.name;
  productForm.querySelector('#productDescription').value = product.description;
  productForm.querySelector('#productFeatures').value = (product.specs || []).join('\n');
  populatePriceInputs(product.prices);
  setImageRequired(false);

  const submitBtn = productForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Product';

  showStatus('Editing product – upload a new image only if you want to replace it.', true);
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteProduct = (productId) => {
  const index = customProducts.findIndex((item) => item.id === productId);
  if (index === -1) return;
  customProducts.splice(index, 1);
  saveProducts();
  renderProductList();
  if (editingProductId === productId) {
    resetFormState();
  }
  showStatus('Product removed. Refresh the product page to see the change.');
};

const toggleEmptyState = () => {
  if (!emptyStateEl) return;
  emptyStateEl.hidden = customProducts.length > 0;
};

const renderProductList = () => {
  if (!listEl) return;
  listEl.innerHTML = '';
  toggleEmptyState();
  if (!customProducts.length) return;

  customProducts.forEach((product) => {
    const item = document.createElement('li');

    const title = document.createElement('h4');
    title.textContent = product.name;

    const actions = document.createElement('div');
    actions.className = 'product-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = product.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = product.id;
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    item.append(title, actions);
    listEl.appendChild(item);
  });
};

renderProductList();

if (listEl) {
  listEl.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;
    const { action, id } = actionBtn.dataset;
    if (action === 'edit') {
      startEditingProduct(id);
    } else if (action === 'delete') {
      deleteProduct(id);
    }
  });
}

const collectPrices = (formData) => {
  const prices = {};
  COUNTRIES.forEach((country) => {
    prices[country] = {};
    FORMS.forEach((form) => {
      const key = `price-${country}-${form}`;
      const value = parseFloat(formData.get(key));
      prices[country][form] = Number.isFinite(value) ? value : null;
    });
  });
  return prices;
};

if (productForm) {
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(productForm);
    const name = (formData.get('productName') || '').trim();
    const description = (formData.get('productDescription') || '').trim();
    const featuresRaw = (formData.get('productFeatures') || '').split('\n');
    const specs = featuresRaw.map((line) => line.trim()).filter(Boolean);
    const file = formData.get('productImage');

    if (!name || !description) {
      showStatus('Please complete all required fields.');
      return;
    }

    const isEditing = Boolean(editingProductId);
    const existingProduct = isEditing
      ? customProducts.find((item) => item.id === editingProductId)
      : null;

    if (!isEditing && !file?.size) {
      showStatus('Please upload an image for the new product.');
      return;
    }

    try {
      let imageData = editingImageData;
      if (file?.size) {
        imageData = await dataURLFromFile(file);
      } else if (!isEditing) {
        imageData = null;
      }

      if (!imageData) {
        showStatus('Unable to read image data. Please try again.');
        return;
      }

      const payload = {
        id: isEditing ? existingProduct.id : `custom-${Date.now()}`,
        name,
        description,
        specs,
        imageData,
        prices: collectPrices(formData),
      };

      if (isEditing) {
        customProducts = customProducts.map((item) => (item.id === payload.id ? payload : item));
      } else {
        customProducts.push(payload);
      }

      saveProducts();
      renderProductList();
      renderProductList();
      resetFormState();
      showStatus(
        isEditing
          ? 'Product updated. Refresh the product page to see the change.'
          : 'Product saved locally. Visit the product page to view it.'
      );
    } catch (error) {
      console.error('Image processing failed', error);
      showStatus('Unable to process the image. Please try again.');
    }
  });
}

const flattenPrices = (prices = {}) => {
  return COUNTRIES.map((country) => {
    const countryPrices = prices[country] || {};
    return FORMS.map((form) => countryPrices[form] ?? '').join(',');
  }).join(',');
};

const exportProductsToCSV = () => {
  if (!customProducts.length) {
    showStatus('Add at least one product before exporting.');
    return;
  }

  const header = [
    'id',
    'name',
    'description',
    'specs',
    'india_capsule',
    'india_tablet',
    'india_powder',
    'uae_capsule',
    'uae_tablet',
    'uae_powder',
    'kenya_capsule',
    'kenya_tablet',
    'kenya_powder',
    'usa_capsule',
    'usa_tablet',
    'usa_powder',
  ].join(',');

  const rows = customProducts.map((product) => {
    const base = [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      `"${product.description.replace(/"/g, '""')}"`,
      `"${(product.specs || []).join(' | ').replace(/"/g, '""')}"`,
    ].join(',');
    return `${base},${flattenPrices(product.prices)}`;
  });

  const blob = new Blob([header, ...rows].join('\n'), { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sanode-products-${Date.now()}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

if (bulkExportBtn) {
  bulkExportBtn.addEventListener('click', exportProductsToCSV);
}


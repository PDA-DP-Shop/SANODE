const COUNTRY_OPTIONS = ['india', 'uae', 'kenya', 'usa'];
const FORM_FACTORS = ['capsule', 'tablet', 'powder'];
const CUSTOM_PRODUCTS_KEY = 'sanodeCustomProducts';

const BASE_PRODUCTS = [
  
];

const DEFAULT_PRICING_MATRIX = {
  india: {
    currency: '₹',
    products: {
      immunity: { capsule: 499, tablet: 469, powder: 539 },
      omega: { capsule: 729, tablet: 699, powder: null },
      protein: { capsule: null, tablet: null, powder: 1299 },
    },
  },
  uae: {
    currency: 'AED ',
    products: {
      immunity: { capsule: 65, tablet: 62, powder: 72 },
      omega: { capsule: 105, tablet: 98, powder: null },
      protein: { capsule: null, tablet: null, powder: 165 },
    },
  },
  kenya: {
    currency: 'KES ',
    products: {
      immunity: { capsule: 1850, tablet: 1725, powder: 2100 },
      omega: { capsule: 2550, tablet: 2420, powder: null },
      protein: { capsule: null, tablet: null, powder: 3825 },
    },
  },
  usa: {
    currency: '$',
    products: {
      immunity: { capsule: 12, tablet: 11, powder: 14 },
      omega: { capsule: 18, tablet: 17, powder: null },
      protein: { capsule: null, tablet: null, powder: 32 },
    },
  },
};

const loadCustomProducts = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to parse stored products', error);
    return [];
  }
};

let customProducts = loadCustomProducts();

const productGrid = document.querySelector('.product-grid');

const createSpecList = (items = []) => {
  const ul = document.createElement('ul');
  ul.className = 'product-specs';
  items.filter(Boolean).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item.trim();
    ul.appendChild(li);
  });
  return ul;
};

const createPriceBlock = (productId, note) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'price-display';

  const label = document.createElement('span');
  label.className = 'price-label';
  label.textContent = 'Partner price';

  const strong = document.createElement('strong');
  strong.dataset.productPrice = productId;
  strong.textContent = 'Contact for quote';

  const helper = document.createElement('span');
  helper.className = 'pricing-note';
  helper.textContent = note || 'per shipment-ready unit';

  wrapper.append(label, strong, helper);
  return wrapper;
};

const createProductCard = (product, { custom = false } = {}) => {
  const card = document.createElement('article');
  card.className = 'product-card';
  if (custom) card.dataset.customProduct = product.id;

  const media = document.createElement('div');
  media.className = 'product-media';
  const img = document.createElement('img');
  img.alt = `${product.name} preview`;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = custom ? product.imageData || './images/SANODE-LOGO.png' : product.imagePath;
  media.appendChild(img);

  const content = document.createElement('div');
  content.className = 'product-content';
  const heading = document.createElement('h3');
  heading.textContent = product.name;

  const desc = document.createElement('p');
  desc.textContent = product.description;

  content.append(heading, desc);
  content.appendChild(createSpecList(product.specs));
  content.appendChild(createPriceBlock(product.id, product.priceNote || 'per configured lot'));

  card.append(media, content);
  return card;
};

const renderProductGrid = () => {
  if (!productGrid) return;
  productGrid.innerHTML = '';
  BASE_PRODUCTS.forEach((product) => {
    productGrid.appendChild(createProductCard(product));
  });
  customProducts.forEach((product) => {
    productGrid.appendChild(createProductCard(product, { custom: true }));
  });
};

renderProductGrid();

const buildPricingMatrix = () => {
  const matrix = JSON.parse(JSON.stringify(DEFAULT_PRICING_MATRIX));

  customProducts.forEach((product) => {
    COUNTRY_OPTIONS.forEach((country) => {
      const base = matrix[country];
      if (!base) return;
      if (!base.products) base.products = {};
      const countryPricing = (product.prices && product.prices[country]) || {};
      base.products[product.id] = FORM_FACTORS.reduce((acc, form) => {
        const value = Number(countryPricing[form]);
        acc[form] = Number.isFinite(value) ? value : null;
        return acc;
      }, {});
    });
  });

  return matrix;
};

let pricingMatrix = buildPricingMatrix();

const countrySelect = document.querySelector('#countrySelect');
const formSelect = document.querySelector('#formSelect');

const updateProductPrices = () => {
  if (!countrySelect || !formSelect) return;
  const countryKey = countrySelect.value;
  const formKey = formSelect.value;
  const countryData = pricingMatrix[countryKey];
  if (!countryData) return;

  document.querySelectorAll('[data-product-price]').forEach((field) => {
    const productId = field.dataset.productPrice;
    const productData = countryData.products?.[productId];
    const amount = productData ? productData[formKey] : null;
    field.textContent =
      Number.isFinite(amount) && amount !== null
        ? `${countryData.currency}${amount}`
        : 'Contact for quote';
  });
};

if (countrySelect && formSelect) {
  countrySelect.addEventListener('change', updateProductPrices);
  formSelect.addEventListener('change', updateProductPrices);
  updateProductPrices();
}

const refreshCustomProducts = () => {
  customProducts = loadCustomProducts();
  pricingMatrix = buildPricingMatrix();
  renderProductGrid();
  updateProductPrices();
};

window.addEventListener('storage', (event) => {
  if (event.key === CUSTOM_PRODUCTS_KEY) {
    refreshCustomProducts();
  }
});


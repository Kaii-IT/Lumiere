/* ================================================================
   shared.js
   Data models (Profile, Account, Product) and localStorage helpers.
   Load this FIRST before any page-specific script.
   ================================================================ */

/* ---- MODELS ---- */

class Profile {
  #name; #email; #contactNumber; #deliveryAddress;

  constructor(name, email, contactNumber, deliveryAddress) {
    this.#name = name;
    this.#email = email;
    this.#contactNumber = contactNumber;
    this.#deliveryAddress = deliveryAddress;
  }

  getName() { return this.#name; }
  getEmail() { return this.#email; }
  getContactNumber() { return this.#contactNumber; }
  getDeliveryAddress() { return this.#deliveryAddress; }

  setName(name) { this.#name = name; }
  setEmail(email) { this.#email = email; }
  setContactNumber(contactNumber) { this.#contactNumber = contactNumber; }
  setDeliveryAddress(deliveryAddress) { this.#deliveryAddress = deliveryAddress; }

  toJSON() {
    return {
      name: this.#name,
      email: this.#email,
      contactNumber: this.#contactNumber,
      deliveryAddress: this.#deliveryAddress
    };
  }
}

class Account extends Profile {
  #username; #password; #cart;

  constructor(name, email, contactNumber, deliveryAddress, username, password, cart) {
    super(name, email, contactNumber, deliveryAddress);
    this.#username = username;
    this.#password = password;
    this.#cart = cart;
  }

  getUsername() { return this.#username; }
  getPassword() { return this.#password; }

  getRawCart() { return this.#cart; }

  getCart() {
    return this.#cart.map(obj =>
      new Product(obj.productId, obj.category, obj.productName, obj.description,
        obj.quantityInStock, obj.price, obj.imageUrl)
    );
  }

  setUsername(username) { this.#username = username; }
  setPassword(password) { this.#password = password; }
  setCart(cart) { this.#cart = cart; }

  toJSON() {
    return {
      name: this.getName(),
      email: this.getEmail(),
      contactNumber: this.getContactNumber(),
      deliveryAddress: this.getDeliveryAddress(),
      username: this.#username,
      password: this.#password,
      cart: this.#cart
    };
  }
}

class AdminAccount {
  #name; #email; #contactNumber; #username; #password;

  constructor(name, email, contactNumber, username, password) {
    this.#name = name;
    this.#email = email;
    this.#contactNumber = contactNumber;
    this.#username = username;
    this.#password = password;
  }

  getName() { return this.#name; }
  getEmail() { return this.#email; }
  getContactNumber() { return this.#contactNumber; }
  getUsername() { return this.#username; }
  getPassword() { return this.#password; }

  setName(name) { this.#name = name; }
  setEmail(email) { this.#email = email; }
  setContactNumber(c) { this.#contactNumber = c; }
  setUsername(username) { this.#username = username; }
  setPassword(password) { this.#password = password; }

  toJSON() {
    return {
      name: this.#name,
      email: this.#email,
      contactNumber: this.#contactNumber,
      username: this.#username,
      password: this.#password
    };
  }
}

class Product {
  #productId; #category; #productName; #description;
  #quantityInStock; #price; #imageUrl;

  constructor(productId, category, productName, description, quantityInStock, price, imageUrl) {
    this.#productId = productId;
    this.#category = category;
    this.#productName = productName;
    this.#description = description;
    this.#quantityInStock = quantityInStock;
    this.#price = price;
    this.#imageUrl = imageUrl;
  }

  getProductId() { return this.#productId; }
  getCategory() { return this.#category; }
  getProductName() { return this.#productName; }
  getDescription() { return this.#description; }
  getQuantityInStock() { return this.#quantityInStock; }
  getPrice() { return this.#price; }
  getImageUrl() { return this.#imageUrl; }

  setProductId(productId) { this.#productId = productId; }
  setCategory(category) { this.#category = category; }
  setProductName(productName) { this.#productName = productName; }
  setDescription(description) { this.#description = description; }
  setQuantityInStock(quantityInStock) { this.#quantityInStock = quantityInStock; }
  setPrice(price) { this.#price = price; }
  setImageUrl(imageUrl) { this.#imageUrl = imageUrl; }

  toJSON() {
    return {
      productId: this.#productId,
      category: this.#category,
      productName: this.#productName,
      description: this.#description,
      quantityInStock: this.#quantityInStock,
      price: this.#price,
      imageUrl: this.#imageUrl
    };
  }
}

class Transaction {
  #transactionId; #customerUsername; #products;
  #totalAmount; #paymentMethod; #status; #deliveryMethod;

  constructor(transactionId, customerUsername, products, totalAmount, paymentMethod, status, deliveryMethod) {
    this.#transactionId = transactionId;
    this.#customerUsername = customerUsername;
    this.#products = products;
    this.#totalAmount = totalAmount;
    this.#paymentMethod = paymentMethod;
    this.#status = status;
    this.#deliveryMethod = deliveryMethod;
  }

  getTransactionId() { return this.#transactionId; }
  getCustomerUsername() { return this.#customerUsername; }

  getProducts() {
    return this.#products.map(obj =>
      new Product(obj.productId, obj.category, obj.productName, obj.productName.description,
        obj.quantityInStock, obj.price, obj.imageUrl)
    );
  }

  getTotalAmount() { return this.#totalAmount; }
  getPaymentMethod() { return this.#paymentMethod; }
  getStatus() { return this.#status; }
  getDeliveryMethod() { return this.#deliveryMethod; }

  setTransactionId(transactionId) { this.#transactionId = transactionId; }
  setCustomerUsername(customerUsername) { this.#customerUsername = customerUsername; }
  setProducts(products) { this.#products = products; }
  setTotalAmount(totalAmount) { this.#totalAmount = totalAmount; }
  setPaymentMethod(paymentMethod) { this.#paymentMethod = paymentMethod; }
  setStatus(status) { this.#status = status; }
  setDeliveryMethod(deliveryMethod) { this.#deliveryMethod = deliveryMethod; }

  toJSON() {
    return {
      transactionId: this.#transactionId,
      customerUsername: this.#customerUsername,
      products: this.#products,
      totalAmount: this.#totalAmount,
      paymentMethod: this.#paymentMethod,
      status: this.#status,
      deliveryMethod: this.#deliveryMethod
    };
  }
}

/* ---- localStorage HELPERS ---- */

function getCustomerDatabase() {
  let raw = JSON.parse(localStorage.getItem("customerDatabase"));
  let clean = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== null && raw[i] !== undefined) clean.push(raw[i]);
  }
  return clean.map(obj => new Account(obj.name, obj.email, obj.contactNumber, obj.deliveryAddress, obj.username, obj.password, obj.cart));
}
function saveCustomerDatabase(db) {
  let seen = {};
  let clean = [];
  for (let i = 0; i < db.length; i++) {
    let obj = db[i];
    if (obj === null || obj === undefined) continue;
    let key = obj.getUsername ? obj.getUsername() : obj.username;
    if (seen[key]) continue;
    seen[key] = true;
    clean.push(obj);
  }
  localStorage.setItem("customerDatabase", JSON.stringify(clean));
}

function getProductDatabase() {
  let raw = JSON.parse(localStorage.getItem("productDatabase"));
  return raw.map(obj =>
    new Product(obj.productId, obj.category, obj.productName, obj.description,
      obj.quantityInStock, obj.price, obj.imageUrl)
  );
}
function saveProductDatabase(db) {
  localStorage.setItem("productDatabase", JSON.stringify(db));
}

function getProductIdCounter() { return Number(localStorage.getItem("productIdCounter")); }
function saveProductIdCounter(id) { localStorage.setItem("productIdCounter", String(id)); }

function getTotalProducts() { return Number(localStorage.getItem("totalProducts")); }
function saveTotalProducts(total) { localStorage.setItem("totalProducts", String(total)); }

function getLoggedInCustomer() {
  let raw = JSON.parse(localStorage.getItem("loggedInCustomer"));
  if (raw === null) return null;
  return new Account(raw.name, raw.email, raw.contactNumber, raw.deliveryAddress, raw.username, raw.password, raw.cart);
}

function saveLoggedInCustomer(customer) {
  localStorage.setItem("loggedInCustomer", JSON.stringify(customer));
}

function getIsAdminLoggedIn() {
  return JSON.parse(localStorage.getItem("isAdminLoggedIn"));
}
function saveIsAdminLoggedIn(isLoggedIn) {
  localStorage.setItem("isAdminLoggedIn", JSON.stringify(isLoggedIn));
}

function getAdminDatabase() {
  let raw = JSON.parse(localStorage.getItem("adminDatabase"));
  let clean = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== null && raw[i] !== undefined) clean.push(raw[i]);
  }
  return clean.map(obj => new AdminAccount(obj.name, obj.email, obj.contactNumber, obj.username, obj.password));
}
function saveAdminDatabase(db) {
  let seen = {};
  let clean = [];
  for (let i = 0; i < db.length; i++) {
    let obj = db[i];
    if (obj === null || obj === undefined) continue;
    let key = obj.getUsername ? obj.getUsername() : obj.username;
    if (seen[key]) continue;
    seen[key] = true;
    clean.push(obj);
  }
  localStorage.setItem("adminDatabase", JSON.stringify(clean));
}

function getLoggedInAdmin() {
  let raw = JSON.parse(localStorage.getItem("loggedInAdmin"));
  if (raw === null) return null;
  return new AdminAccount(raw.name, raw.email, raw.contactNumber, raw.username, raw.password);
}
function saveLoggedInAdmin(admin) {
  localStorage.setItem("loggedInAdmin", JSON.stringify(admin));
}

function getTransactionDatabase() {
  let raw = JSON.parse(localStorage.getItem("transactionDatabase"));
  if (!raw) return [];
  let clean = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== null && raw[i] !== undefined) clean.push(raw[i]);
  }
  return clean;
}
function saveTransactionDatabase(db) {
  localStorage.setItem("transactionDatabase", JSON.stringify(db));
}

function getTransactionIdCounter() {
  return Number(localStorage.getItem("transactionIdCounter")) || 1;
}
function saveTransactionIdCounter(id) {
  localStorage.setItem("transactionIdCounter", String(id));
}

function getImagePlaceholderByCategory(category) {
  if (category === "electronics") return '<i class="fa-solid fa-display"></i>,Electronics';
  if (category === "clothing") return '<i class="fa-solid fa-shirt"></i>,Clothing';
  if (category === "groceries") return '<i class="fa-solid fa-basket-shopping"></i>,Groceries';
  if (category === "health-beauty") return '<i class="fa-solid fa-pills"></i>,Health &amp; Beauty';
  if (category === "home-living") return '<i class="fa-solid fa-couch"></i>,Home &amp; Living';
  return ",";
}

function showHidePassword(field, button) {
  let type = field.attr("type") === "password" ? "text" : "password";
  field.attr("type", type);
  let label = type === "password" ? "Show" : "Hide";
  button.text(label);
}

/* ---- BOOTSTRAP: set up storage keys once on first ever visit ---- */
(function () {

  // Always ensure session keys exist regardless of seed state
  if (!localStorage.getItem("loggedInCustomer"))
    localStorage.setItem("loggedInCustomer", JSON.stringify(null));

  if (!localStorage.getItem("isAdminLoggedIn"))
    localStorage.setItem("isAdminLoggedIn", JSON.stringify(false));

  if (!localStorage.getItem("loggedInAdmin"))
    localStorage.setItem("loggedInAdmin", JSON.stringify(null));

  // If the system has already been seeded (first load or post-clear), skip
  if (localStorage.getItem("systemSeeded") === "true") return;

  // ---- SEED ADMIN ACCOUNTS (3 total) ----
  var admins = [
    new AdminAccount("Lumiere Admin", "admin@lumiere.com", "00000000000", "lumiereAdmin", "admin123"),
    new AdminAccount("Store Manager", "manager@lumiere.com", "09171234567", "store_manager", "manager123"),
    new AdminAccount("Inventory Staff", "inventory@lumiere.com", "09181234567", "inventory_staff", "staff123")
  ];
  localStorage.setItem("adminDatabase", JSON.stringify(admins));

  // ---- SEED CUSTOMER ACCOUNTS (2 total) ----
  var customers = [
    new Account("Maria Santos", "maria@email.com", "09201234567", "123 Rizal St., Brgy. Poblacion, Makati City, Metro Manila 1210", "maria_santos", "customer123", []),
    new Account("Juan Dela Cruz", "juan@email.com", "09301234567", "456 Mabini Ave., Brgy. San Antonio, Quezon City, Metro Manila 1100", "juan_dela_cruz", "customer123", [])
  ];
  localStorage.setItem("customerDatabase", JSON.stringify(customers));

  // ---- SEED PRODUCTS (10 total, 2 per category) ----
  var products = [
    { productId: 1, category: "electronics", productName: "Apple iPhone 15 128GB", description: "6.1-inch Super Retina XDR display, A16 Bionic chip, 48MP camera system.", quantityInStock: 15, price: 54990, imageUrl: "https://d1rlzxa98cyc61.cloudfront.net/catalog/product/cache/1801c418208f9607a371e61f8d9184d9/1/8/189830_2023_1.jpg"},
    { productId: 2, category: "electronics", productName: "Samsung Galaxy Tab S9", description: "11-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, IP68 water resistant.", quantityInStock: 10, price: 42990, imageUrl: "https://images.samsung.com/is/image/samsung/assets/ph/galaxy-tab-s9/feature/galaxy-tab-s9-size-graphite-startframe-mo.jpg" },
    { productId: 3, category: "clothing", productName: "Levi's 511 Slim Fit Jeans", description: "Classic slim fit from hip to ankle, sits below waist, stretch denim fabric.", quantityInStock: 30, price: 3299, imageUrl: "https://levi.com.ph/cdn/shop/files/045116216_2_CL_D1_67ecfe2d-6286-45b3-af4f-6f9b57ff1a64_3558X2000.progressive.jpg?v=1759141695" },
    { productId: 4, category: "clothing", productName: "Uniqlo Ultra Light Down Jacket", description: "Lightweight 90% down fill, packable into its own pocket, wind-resistant shell.", quantityInStock: 25, price: 2990, imageUrl: "https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/459619/sub/goods_459619_sub15_3x4.jpg?width=494" },
    { productId: 5, category: "groceries", productName: "Nescafe Gold Blend Coffee 200g", description: "Smooth and balanced instant coffee made from 100% responsibly sourced beans.", quantityInStock: 50, price: 459, imageUrl: "https://assets.landers.ph/catalog/product/1/2/128327-11_2.jpg" },
    { productId: 6, category: "groceries", productName: "Kirkland Organic Extra Virgin Olive Oil 1L", description: "Cold-pressed, certified organic, ideal for cooking and salad dressings.", quantityInStock: 40, price: 899, imageUrl: "https://www.instacart.com/assets/domains/product-image/file/large_3e5a6741-5337-4e5b-94b0-41cff52d662b.jpeg" },
    { productId: 7, category: "health-beauty", productName: "CeraVe Moisturizing Cream 340g", description: "Non-greasy formula with ceramides and hyaluronic acid for all-day hydration.", quantityInStock: 35, price: 799, imageUrl: "https://www.ceravearabia.com/-/media/project/loreal/brand-sites/cerave/americas/gcc/products-v3/packshot-images-new/moisturising-cream/moisturising-cream-340g-lg.jpg?rev=f0fd05d55eaf452f9a91fb1e46f708e7" },
    { productId: 8, category: "health-beauty", productName: "Oral-B Pro 1000 Electric Toothbrush", description: "Removes up to 300% more plaque than a manual brush, 2-minute timer included.", quantityInStock: 20, price: 2499, imageUrl: "https://cdn11.bigcommerce.com/s-2idmiil7bp/images/stencil/1280x1280/products/1140/8000/pro-1000-twin-pack-25-nobadge__13975.1761796557.jpg?c=1" },
    { productId: 9, category: "home-living", productName: "Miniso Aromatherapy Diffuser", description: "Ultrasonic mist diffuser with 7 LED colors, auto shut-off, 300ml capacity.", quantityInStock: 28, price: 699, imageUrl: "https://laz-img-sg.alicdn.com/p/f54c04572959361b6f4541a938123a38.jpg" },
    { productId: 10, category: "home-living", productName: "Lifetime 6ft Folding Table", description: "Commercial grade HDPE top, steel frame, holds up to 300lbs, easy fold storage.", quantityInStock: 12, price: 4299, imageUrl: "https://www.acehardware.ph/cdn/shop/products/edit-3a-jpg_2c911.jpg?v=1737471047&width=416" }
  ];
  localStorage.setItem("productDatabase", JSON.stringify(products));
  localStorage.setItem("productIdCounter", "11");
  localStorage.setItem("totalProducts", "10");

  // ---- SEED TRANSACTIONS (4 total, mixed statuses) ----
  var transactions = [
    {
      transactionId: 1,
      customerUsername: "maria_santos",
      customerName: "Maria Santos",
      items: [
        { productId: 7, productName: "CeraVe Moisturizing Cream 340g", category: "health-beauty", price: 799, qty: 2, imageUrl: "" },
        { productId: 9, productName: "Miniso Aromatherapy Diffuser", category: "home-living", price: 699, qty: 1, imageUrl: "" }
      ],
      subtotal: 2297,
      shipping: 150,
      total: 2447,
      paymentMethod: "gcash",
      deliveryMethod: "standard",
      status: "Completed"
    },
    {
      transactionId: 2,
      customerUsername: "juan_dela_cruz",
      customerName: "Juan Dela Cruz",
      items: [
        { productId: 5, productName: "Nescafe Gold Blend Coffee 200g", category: "groceries", price: 459, qty: 3, imageUrl: "" },
        { productId: 6, productName: "Kirkland Organic Extra Virgin Olive Oil 1L", category: "groceries", price: 899, qty: 1, imageUrl: "" }
      ],
      subtotal: 2276,
      shipping: 350,
      total: 2626,
      paymentMethod: "cod",
      deliveryMethod: "express",
      status: "Processing"
    },
    {
      transactionId: 3,
      customerUsername: "maria_santos",
      customerName: "Maria Santos",
      items: [
        { productId: 3, productName: "Levi's 511 Slim Fit Jeans", category: "clothing", price: 3299, qty: 1, imageUrl: "" }
      ],
      subtotal: 3299,
      shipping: 150,
      total: 3449,
      paymentMethod: "maya",
      deliveryMethod: "standard",
      status: "Delivered"
    },
    {
      transactionId: 4,
      customerUsername: "juan_dela_cruz",
      customerName: "Juan Dela Cruz",
      items: [
        { productId: 1, productName: "Apple iPhone 15 128GB", category: "electronics", price: 54990, qty: 1, imageUrl: "" }
      ],
      subtotal: 54990,
      shipping: 500,
      total: 55490,
      paymentMethod: "card",
      deliveryMethod: "sameday",
      status: "Pending"
    }
  ];
  localStorage.setItem("transactionDatabase", JSON.stringify(transactions));
  localStorage.setItem("transactionIdCounter", "5");

  // Mark system as seeded so dummies never load again until localStorage is cleared
  localStorage.setItem("systemSeeded", "true");

})();

/* =====================================================================
   LUMIÈRE CUSTOM MODAL SYSTEM
   showAlert(type, title, message)
   showConfirm(type, title, message, onConfirm)

   Types: "success" | "info" | "warning" | "danger"
   ===================================================================== */

(function () {
  var MODAL_TYPES = {
    success: { icon: "fa-solid fa-circle-check", color: "#2E9E5E", bg: "#F0FBF4" },
    info: { icon: "fa-solid fa-circle-info", color: "#1D4ED8", bg: "#EFF6FF" },
    warning: { icon: "fa-solid fa-triangle-exclamation", color: "#B45309", bg: "#FFFBEB" },
    danger: { icon: "fa-solid fa-circle-xmark", color: "#DC2626", bg: "#FEF2F2" }
  };

  function buildModal() {
    if ($("#lumiere-modal-overlay").length) return;
    $("body").append(
      '<div id="lumiere-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99999;align-items:center;justify-content:center;">'
      + '<div id="lumiere-modal-box" style="background:#fff;border-radius:16px;width:90vw;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.18);overflow:hidden;font-family:inherit;">'
      + '<div id="lumiere-modal-header" style="padding:28px 28px 0;text-align:center;">'
      + '<div id="lumiere-modal-logo" style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:1.1rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;margin-bottom:18px;">LUMI<span style="color:var(--accent,#b08d6a);">È</span>RE</div>'
      + '<div id="lumiere-modal-icon-wrap" style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">'
      + '<i id="lumiere-modal-icon" style="font-size:1.7rem;"></i>'
      + '</div>'
      + '<div id="lumiere-modal-title" style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:1.25rem;font-weight:600;color:#1a1a1a;margin-bottom:8px;"></div>'
      + '<div id="lumiere-modal-message" style="font-size:.9rem;color:#666;line-height:1.6;padding:0 4px 24px;"></div>'
      + '</div>'
      + '<div id="lumiere-modal-footer" style="padding:0 28px 24px;display:flex;flex-direction:column;gap:10px;"></div>'
      + '</div>'
      + '</div>'
    );
  }

  function applyType(type) {
    var t = MODAL_TYPES[type] || MODAL_TYPES.info;
    $("#lumiere-modal-icon").attr("class", t.icon).css("color", t.color);
    $("#lumiere-modal-icon-wrap").css("background", t.bg);
  }

  function openModal() {
    $("#lumiere-modal-overlay").css("display", "flex").hide().fadeIn(250);
  }

  function closeModal() {
    $("#lumiere-modal-overlay").fadeOut(200);
  }

  window.showAlert = function (type, title, message, onConfirm) {
    buildModal();
    applyType(type);
    $("#lumiere-modal-title").text(title);
    $("#lumiere-modal-message").text(message);
    $("#lumiere-modal-overlay").data("type", "alert");
    $("#lumiere-modal-footer").html(
      '<button type="button" id="lumiere-modal-ok" class="btn btn-accent btn-lg" style="width:100%;">OK</button>'
    );
    $("#lumiere-modal-ok").off("click").on("click", function () {
      closeModal();
      if (typeof onConfirm === "function") onConfirm();
    });
    openModal();
  };

  window.showConfirm = function (type, title, message, onConfirm) {
    buildModal();
    applyType(type);
    $("#lumiere-modal-title").text(title);
    $("#lumiere-modal-message").text(message);
    $("#lumiere-modal-overlay").data("type", "confirm");
    $("#lumiere-modal-footer").html(
      '<button type="button" id="lumiere-modal-confirm" class="btn btn-accent btn-lg" style="width:100%;"></button>'
      + '<button type="button" id="lumiere-modal-cancel" class="btn btn-outline btn-lg" style="width:100%;">Cancel</button>'
    );
    var confirmLabels = { success: "Confirm", info: "OK", warning: "Proceed", danger: "Yes, Delete" };
    $("#lumiere-modal-confirm").text(confirmLabels[type] || "Confirm");
    $("#lumiere-modal-confirm").off("click").on("click", function () { closeModal(); if (typeof onConfirm === "function") onConfirm(); });
    $("#lumiere-modal-cancel").off("click").on("click", function () { closeModal(); });
    openModal();
  };
})();
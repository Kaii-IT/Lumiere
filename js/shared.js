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
  
  getCart() { 
    return this.#cart.map(obj => 
      new Product(obj.productId, obj.category, obj.productName, obj.productName.description, 
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

/* ---- localStorage HELPERS ---- */

function getCustomerDatabase() {
  let raw = JSON.parse(localStorage.getItem("customerDatabase"));
  return raw.map(obj =>
    new Account(obj.name, obj.email, obj.contactNumber, obj.deliveryAddress, obj.username, obj.password, obj.cart)
  );
}
function saveCustomerDatabase(db) {
  localStorage.setItem("customerDatabase", JSON.stringify(db));
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

function getImagePlaceholderByCategory(category) {
  if (category === "electronics")   return '<i class="fa-solid fa-display"></i>,Electronics';
  if (category === "clothing")      return '<i class="fa-solid fa-shirt"></i>,Clothing';
  if (category === "groceries")     return '<i class="fa-solid fa-basket-shopping"></i>,Groceries';
  if (category === "health-beauty") return '<i class="fa-solid fa-pills"></i>,Health &amp; Beauty';
  if (category === "home-living")   return '<i class="fa-solid fa-couch"></i>,Home &amp; Living';
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
  if (!localStorage.getItem("customerDatabase"))
    localStorage.setItem("customerDatabase", JSON.stringify([]));

  if (!localStorage.getItem("productDatabase")) {
    localStorage.setItem("productDatabase", JSON.stringify([]));
    localStorage.setItem("totalProducts", "0");
  }

  if (!localStorage.getItem("productIdCounter"))
    localStorage.setItem("productIdCounter", "1");

  if (!localStorage.getItem("loggedInCustomer")) {
    localStorage.setItem("loggedInCustomer", JSON.stringify(null));
  }

  if (!localStorage.getItem("isAdminLoggedIn")) {
    localStorage.setItem("isAdminLoggedIn", JSON.stringify(false));
  }
})();

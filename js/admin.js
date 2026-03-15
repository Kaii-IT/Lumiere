/* admin.js — Admin page logic. Requires: shared.js */


/* =====================
   VIEW NAVIGATION
   ===================== */

function showView(viewId) {
  $(".sub-section").addClass("hidden");
  $("#" + viewId).removeClass("hidden").hide().fadeIn(400);
  $(".nav-link, .sidebar-nav a").removeClass("active");
  $("a[onclick*=\"'" + viewId + "'\"]").addClass("active");
  window.scrollTo(0, 0);
  return false;
}


/* =====================
   ADMIN ACCOUNT HELPERS
   ===================== */

function displayLoggedInAdmin() {
  let admin = getLoggedInAdmin();
  if (!admin) return;
  $("#loggedin-admin-name").text(admin.getName());
  $("#loggedin-admin-username").text("@" + admin.getUsername());
  $("#loggedin-admin-email").text(admin.getEmail());
  $("#loggedin-admin-contact").text(admin.getContactNumber());
}

function renderAdminAccountsTable() {
  let adminDatabase = getAdminDatabase();
  let loggedInAdmin = getLoggedInAdmin();
  $("#admin-accounts-tbody").empty();

  if (adminDatabase.length === 0) {
    $("#admin-accounts-tbody").html('<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">No admin accounts found.</td></tr>');
    return;
  }

  for (let index = 0; index < adminDatabase.length; index++) {
    let admin = adminDatabase[index];
    let isCurrentUser = loggedInAdmin && admin.getUsername() === loggedInAdmin.getUsername();

    let badgeHtml = isCurrentUser
      ? ' <span style="font-size:.7rem;background:var(--accent-pale);color:var(--accent-dark);padding:2px 8px;border-radius:100px;font-weight:500;">You</span>'
      : "";

    let actionsHtml = isCurrentUser
      ? '<span style="font-size:.8rem;color:#aaa;">—</span>'
      : '<div style="display:flex;gap:8px;">'
        + '<button type="button" class="btn btn-outline btn-sm editAdminBtn" data-username="' + admin.getUsername() + '">&#10000; Edit</button>'
        + '<button type="button" class="btn btn-danger btn-sm deleteAdminBtn" data-username="' + admin.getUsername() + '">&#10005; Delete</button>'
        + '</div>';

    $("#admin-accounts-tbody").append(
      '<tr>'
      + '<td>' + admin.getName() + badgeHtml + '</td>'
      + '<td>' + admin.getEmail() + '</td>'
      + '<td>' + admin.getContactNumber() + '</td>'
      + '<td>' + admin.getUsername() + '</td>'
      + '<td>' + actionsHtml + '</td>'
      + '</tr>'
    );
  }
}

// Validates the add/edit admin form fields. Pass isEdit=true to skip password fields.
function checkAdminAccountFields(name, email, contactNumber, username, password, confirmPassword, isEdit) {
  let isValid = true;

  let nameErrorId     = isEdit ? "#edit-admin-name-error"     : "#admin-name-error";
  let emailErrorId    = isEdit ? "#edit-admin-email-error"    : "#admin-email-error";
  let contactErrorId  = isEdit ? "#edit-admin-contact-error"  : "#admin-contact-error";
  let usernameErrorId = isEdit ? "#edit-admin-username-error" : "#admin-username-error";

  if (!name || name.length < 3) {
    $(nameErrorId).text("Full name is required and must be at least 3 characters.");
    isValid = false;
  } else { $(nameErrorId).text(""); }

  let atIndex = email.indexOf("@");
  let dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex || email.includes(" ") || !email.endsWith(".com")) {
    $(emailErrorId).text("Email is required and must be valid.");
    isValid = false;
  } else { $(emailErrorId).text(""); }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $(contactErrorId).text("Contact number is required, must be at least 8 digits, and valid.");
    isValid = false;
  } else { $(contactErrorId).text(""); }

  if (!username || username.length < 3 || username.length > 20 || username.includes(" ")) {
    $(usernameErrorId).text("Username must be 3–20 characters with no spaces.");
    isValid = false;
  } else { $(usernameErrorId).text(""); }

  if (!isEdit) {
    if (!password || password.length < 8) {
      $("#admin-password-error").text("Password is required and must be at least 8 characters.");
      isValid = false;
    } else { $("#admin-password-error").text(""); }

    if (password !== confirmPassword) {
      $("#admin-confirm-password-error").text("Passwords do not match.");
      isValid = false;
    } else if (password && password.length >= 8) {
      $("#admin-confirm-password-error").text("");
    }
  }

  return isValid;
}


/* =====================
   MODAL HELPERS
   ===================== */

function openModal(modalId) {
  $(".modal-backdrop").removeClass("hidden").hide().fadeIn(300);
  $("#" + modalId).css("display", "block").hide().fadeIn(300);
}

function closeModal(modalId) {
  $(".modal-backdrop").fadeOut(200);
  $("#" + modalId).fadeOut(200);
}

function openAddAdminModal() {
  openModal("add-admin-modal");
}

function closeAddAdminModal() {
  closeModal("add-admin-modal");
  $("#add-admin-form")[0].reset();
  $(".validation-msg", "#add-admin-form").text("");
}

function openEditAdminModal(username) {
  let adminDatabase = getAdminDatabase();
  let targetAdmin = null;
  for (let index = 0; index < adminDatabase.length; index++) {
    if (adminDatabase[index].getUsername() === username) {
      targetAdmin = adminDatabase[index];
      break;
    }
  }
  if (!targetAdmin) return;

  $("#edit-admin-name").val(targetAdmin.getName());
  $("#edit-admin-email").val(targetAdmin.getEmail());
  $("#edit-admin-contact").val(targetAdmin.getContactNumber());
  $("#edit-admin-username").val(targetAdmin.getUsername());
  $(".validation-msg", "#edit-admin-form").text("");
  $("#saveEditAdminBtn").data("username", username);
  openModal("edit-admin-modal");
}

function closeEditAdminModal() {
  closeModal("edit-admin-modal");
}

function openAddProductModal() {
  openModal("add-product-modal");
}

function closeAddProductModal() {
  closeModal("add-product-modal");
}


/* =====================
   PRODUCT HELPERS
   ===================== */

function generateAdminProductCard(product, index) {
  if (!product) return "";

  let productId   = product.getProductId();
  let category    = product.getCategory();
  let name        = product.getProductName();
  let description = product.getDescription();
  let quantity    = product.getQuantityInStock();
  let price       = product.getPrice();
  let imageUrl    = product.getImageUrl();

  let parts    = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0];
  let label    = parts[1];

  return '<article class="product-card">'
    + '<div class="product-img-wrap">'
    + '<div class="product-img-placeholder hidden">' + iconHtml + '<span>' + label + '</span></div>'
    + '<img src="' + imageUrl + '" class="product-img" onerror="this.style.display=\'none\';this.previousElementSibling.classList.remove(\'hidden\');">'
    + '</div>'
    + '<div class="product-body">'
    + '<div class="product-category">ID: ' + productId + ' - ' + label + '</div>'
    + '<h3 class="product-name">' + name + '</h3>'
    + '<p class="product-desc">' + description + '</p>'
    + '<p class="product-category" style="font-size:11px;">Quantity: ' + quantity + '</p>'
    + '<div class="product-price">&#8369;' + price + '</div>'
    + '<div class="product-footer"><div style="display:flex;gap:8px;align-items:center;">'
    + '<button type="button" class="btn btn-outline btn-sm editProductBtn" data-id="' + index + '">&#10000; Edit</button>'
    + '<button type="button" class="btn btn-danger btn-sm deleteProductBtn" data-id="' + index + '">&#10005; Delete</button>'
    + '</div></div></div></article>';
}

function renderAdminProductCards() {
  $.each(getProductDatabase(), function (index, product) {
    $("#admin-product-grid").append(generateAdminProductCard(product, index));
  });
}

function checkProductFields(formElement, category, productName, description, quantity, price) {
  let isValid = true;
  let errorMessages = formElement.querySelectorAll(".validation-msg");

  if (!category) {
    errorMessages[0].textContent = "Please select a category.";
    isValid = false;
  } else { errorMessages[0].textContent = ""; }

  if (!productName || productName.length < 3) {
    errorMessages[1].textContent = "Product name must be at least 3 characters.";
    isValid = false;
  } else { errorMessages[1].textContent = ""; }

  if (!description || description.length < 10) {
    errorMessages[2].textContent = "Description must be at least 10 characters.";
    isValid = false;
  } else { errorMessages[2].textContent = ""; }

  if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) < 0) {
    errorMessages[3].textContent = "Quantity must be a positive number.";
    isValid = false;
  } else { errorMessages[3].textContent = ""; }

  if (!price || Number.isNaN(Number(price)) || Number(price) < 0) {
    errorMessages[4].textContent = "Price must be a positive number.";
    isValid = false;
  } else { errorMessages[4].textContent = ""; }

  return isValid;
}

// When a product is edited or deleted, update or remove it from every customer's cart.
// Pass quantity = 0 to remove the product entirely.
function cleanupCartsForProduct(productId, newQuantity) {
  let rawDatabase = JSON.parse(localStorage.getItem("customerDatabase"));
  if (!rawDatabase) return;

  $.each(rawDatabase, function (index, customerObject) {
    if (!customerObject || !customerObject.cart) return;

    let updatedCart = [];
    $.each(customerObject.cart, function (cartIndex, cartItem) {
      if (cartItem.productId !== productId) {
        updatedCart.push(cartItem);
      } else if (newQuantity > 0) {
        // Product still exists — update its stock and cap qty if needed
        cartItem.quantityInStock = newQuantity;
        if (cartItem.qty > newQuantity) cartItem.qty = newQuantity;
        updatedCart.push(cartItem);
      }
      // quantity = 0 means deleted, so we skip it (remove from cart)
    });

    rawDatabase[index].cart = updatedCart;
  });

  localStorage.setItem("customerDatabase", JSON.stringify(rawDatabase));

  // Also update the currently logged-in customer's session if they're affected
  let loggedInCustomer = JSON.parse(localStorage.getItem("loggedInCustomer"));
  if (!loggedInCustomer || !loggedInCustomer.cart) return;

  let updatedSessionCart = [];
  $.each(loggedInCustomer.cart, function (cartIndex, cartItem) {
    if (cartItem.productId !== productId) {
      updatedSessionCart.push(cartItem);
    } else if (newQuantity > 0) {
      cartItem.quantityInStock = newQuantity;
      if (cartItem.qty > newQuantity) cartItem.qty = newQuantity;
      updatedSessionCart.push(cartItem);
    }
  });

  loggedInCustomer.cart = updatedSessionCart;
  localStorage.setItem("loggedInCustomer", JSON.stringify(loggedInCustomer));
}


/* =====================
   PRODUCT SEARCH & FILTER
   ===================== */

let searchResults = [];
let searched = false;

function searchProductsByQuery(query) {
  let products = getProductDatabase();
  if (!query || products.length === 0) return;

  searchResults = [];
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let name        = product.getProductName().toLowerCase();
    let description = product.getDescription().toLowerCase();

    if (name.includes(query) || description.includes(query)) {
      $("#search-results-grid").append(generateAdminProductCard(product, index));
      searchResults.push(product);
    }
  });

  searched = true;
}

function filterProductsByCategory(filter) {
  // If a search is active, filter within those results; otherwise filter all products
  let products = searched ? searchResults : getProductDatabase();
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    if (product.getCategory().includes(filter)) {
      $("#search-results-grid").append(generateAdminProductCard(product, index));
    }
  });
}


/* =====================
   TRANSACTION HELPERS
   ===================== */

const ADMIN_ONGOING_STATUSES   = ["Pending", "Processing", "Shipped", "Delivered", "Processing Return", "Issuing Refund"];
const ADMIN_COMPLETED_STATUSES = ["Completed", "Cancelled", "Denied Return", "Returned", "Refunded"];
const ADMIN_PAYMENT_LABELS     = { cod: "Cash on Delivery", gcash: "GCash", maya: "Maya", card: "Debit/Credit Card" };
const ADMIN_DELIVERY_LABELS    = { standard: "Standard", express: "Express", sameday: "Same Day" };

function getAdminStatusBadgeClass(status) {
  if (status === "Pending")           return "status-pending";
  if (status === "Processing")        return "status-processing";
  if (status === "Shipped")           return "status-processing";
  if (status === "Delivered")         return "status-pending";
  if (status === "Completed")         return "status-completed";
  if (status === "Cancelled")         return "status-cancelled";
  if (status === "Denied Return")     return "status-cancelled";
  if (status === "Processing Return") return "status-returned";
  if (status === "Issuing Refund")    return "status-returned";
  if (status === "Returned")          return "status-returned";
  if (status === "Refunded")          return "status-returned";
  return "status-pending";
}

function generateAdminItemsCollapsible(items, transactionId) {
  let listHtml = '<ul style="margin:6px 0 0 12px;padding:0;">';
  for (let index = 0; index < items.length; index++) {
    listHtml += '<li style="font-size:.82rem;color:var(--ink-soft);padding:2px 0;">'
      + items[index].productName + ' &times;' + items[index].qty + '</li>';
  }
  listHtml += '</ul>';
  return '<div>'
    + '<button type="button" class="btn btn-outline btn-sm admin-toggle-items-btn" data-target="admin-items-' + transactionId + '" style="font-size:.75rem;padding:4px 10px;">'
    + items.length + ' item' + (items.length > 1 ? 's' : '') + ' ▾</button>'
    + '<div id="admin-items-' + transactionId + '" style="display:none;">' + listHtml + '</div>'
    + '</div>';
}

function renderAdminTransactionTables() {
  let allTransactions = getTransactionDatabase();
  let ongoingOrders   = [];
  let completedOrders = [];

  for (let index = 0; index < allTransactions.length; index++) {
    let transaction = allTransactions[index];
    if (ADMIN_ONGOING_STATUSES.indexOf(transaction.status) !== -1) {
      ongoingOrders.push(transaction);
    } else {
      completedOrders.push(transaction);
    }
  }

  // Ongoing orders table
  let ongoingHtml = "";
  if (ongoingOrders.length === 0) {
    ongoingHtml = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">No active orders.</td></tr>';
  } else {
    for (let index = 0; index < ongoingOrders.length; index++) {
      let transaction = ongoingOrders[index];
      ongoingHtml += '<tr>'
        + '<td><button type="button" class="btn btn-outline btn-sm txn-id-btn" data-txn-id="' + transaction.transactionId + '" style="font-family:monospace;">TXN-' + transaction.transactionId + '</button></td>'
        + '<td>' + transaction.customerName + '<br><span style="font-size:.78rem;color:#aaa;">@' + transaction.customerUsername + '</span></td>'
        + '<td>' + generateAdminItemsCollapsible(transaction.items, "proc-" + transaction.transactionId) + '</td>'
        + '<td style="font-weight:600;">&#8369;' + transaction.total + '</td>'
        + '<td>' + (ADMIN_PAYMENT_LABELS[transaction.paymentMethod] || transaction.paymentMethod) + '</td>'
        + '<td>' + (ADMIN_DELIVERY_LABELS[transaction.deliveryMethod] || transaction.deliveryMethod) + '</td>'
        + '<td><span class="status-badge ' + getAdminStatusBadgeClass(transaction.status) + '">● ' + transaction.status + '</span></td>'
        + '</tr>';
    }
  }
  $("#admin-processing-tbody").html(ongoingHtml);

  // Completed orders table
  let completedHtml = "";
  if (completedOrders.length === 0) {
    completedHtml = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">No completed orders yet.</td></tr>';
  } else {
    for (let index = 0; index < completedOrders.length; index++) {
      let transaction = completedOrders[index];
      completedHtml += '<tr>'
        + '<td><span class="order-id" style="font-family:monospace;">TXN-' + transaction.transactionId + '</span></td>'
        + '<td>' + transaction.customerName + '<br><span style="font-size:.78rem;color:#aaa;">@' + transaction.customerUsername + '</span></td>'
        + '<td>' + generateAdminItemsCollapsible(transaction.items, "comp-" + transaction.transactionId) + '</td>'
        + '<td style="font-weight:600;">&#8369;' + transaction.total + '</td>'
        + '<td>' + (ADMIN_PAYMENT_LABELS[transaction.paymentMethod] || transaction.paymentMethod) + '</td>'
        + '<td>' + (ADMIN_DELIVERY_LABELS[transaction.deliveryMethod] || transaction.deliveryMethod) + '</td>'
        + '<td><span class="status-badge ' + getAdminStatusBadgeClass(transaction.status) + '">● ' + transaction.status + '</span></td>'
        + '</tr>';
    }
  }
  $("#admin-completed-tbody").html(completedHtml);
}

function updateDashboardStats() {
  let transactionDatabase = getTransactionDatabase();
  let totalRevenue   = 0;
  let pendingReturns = 0;
  let totalOrders    = transactionDatabase.length;

  for (let index = 0; index < transactionDatabase.length; index++) {
    let transaction = transactionDatabase[index];
    if (transaction.status === "Completed") {
      totalRevenue += Number(transaction.total);
    }
    if (transaction.status === "Processing Return" || transaction.status === "Issuing Refund") {
      pendingReturns++;
    }
  }

  $("#total-orders").text(totalOrders);
  $("#total-revenue").text("₱" + totalRevenue);
  $("#pending-returns").text(pendingReturns);
}


/* =====================
   LOGOUT
   ===================== */

$(document).ready(function () {

  $("#logoutBtn, #logoutBtnSidebar").click(function () {
    showConfirm("warning", "Log Out", "Are you sure you want to log out?", function () {
      saveIsAdminLoggedIn(false);
      location.replace("../html/auth.html");
    });
  });

});


/* =====================
   PRODUCT MANAGEMENT
   ===================== */

$(document).ready(function () {

  // Open the Add Product modal
  $("#openAddProductModalBtn").click(function () {
    openAddProductModal();
  });

  // Close the Add Product modal and clear the form
  $("#closeAddProductModal").click(function () {
    closeAddProductModal();
    $("#add-product-form")[0].reset();
    $(".validation-msg", "#add-product-form").text("");
  });

  // Submit new product
  $("#addProductBtn").click(function () {
    let category    = $("#product-category").val().trim();
    let productName = $("#product-name").val().trim();
    let description = $("#product-description").val().trim();
    let quantity    = $("#product-quantity").val().trim();
    let price       = $("#product-price").val().trim();
    let imageUrl    = $("#product-image-url").val().trim();
    let formElement = $("#add-product-form")[0];

    if (checkProductFields(formElement, category, productName, description, quantity, price)) {
      let newProductId  = getProductIdCounter();
      let newProduct    = new Product(newProductId, category, productName, description, quantity, price, imageUrl);
      let productDatabase = getProductDatabase();
      let newIndex      = productDatabase.length;

      productDatabase.push(newProduct);
      saveProductDatabase(productDatabase);
      saveProductIdCounter(++newProductId);
      saveTotalProducts(getProductDatabase().length);

      $("#total-products").text(getTotalProducts());
      $("#clearAddProductForm").click();
      $("#admin-product-grid").append(generateAdminProductCard(newProduct, newIndex));
      closeAddProductModal();
      showAlert("success", "Product Added", "The product has been added successfully.");
    }
  });

  // Open the Edit Product modal and fill in the current values
  $(document).on("click", ".editProductBtn", function () {
    let product = getProductDatabase()[$(this).data("id")];
    $("#update-product-category").val(product.getCategory());
    $("#update-product-name").val(product.getProductName());
    $("#update-product-description").val(product.getDescription());
    $("#update-product-quantity").val(product.getQuantityInStock());
    $("#update-product-price").val(product.getPrice());
    $("#update-product-image-url").val(product.getImageUrl());
    $("#updateProductBtn").data("id", $(this).data("id"));
    openModal("admin-update-product-section");
  });

  // Close any visible modal when clicking the backdrop
  $(document).on("click", ".modal-backdrop", function () {
    $(".modal").each(function () {
      if ($(this).is(":visible")) $(this).fadeOut(200);
    });
    $(".modal-backdrop").fadeOut(200);
  });

  $("#closeUpdateModal").click(function () {
    closeModal("admin-update-product-section");
  });

  // Save changes to an existing product
  $("#updateProductBtn").on("click", function () {
    let category    = $("#update-product-category").val().trim();
    let productName = $("#update-product-name").val().trim();
    let description = $("#update-product-description").val().trim();
    let quantity    = $("#update-product-quantity").val().trim();
    let price       = $("#update-product-price").val().trim();
    let imageUrl    = $("#update-product-image-url").val().trim();
    let formElement = $("#update-product-form")[0];

    if (checkProductFields(formElement, category, productName, description, quantity, price)) {
      let productIndex    = Number($(this).data("id"));
      let productDatabase = getProductDatabase();
      let oldProduct      = productDatabase[productIndex];
      let updatedProduct  = new Product(oldProduct.getProductId(), category, productName, description, quantity, price, imageUrl);

      productDatabase[productIndex] = updatedProduct;
      saveProductDatabase(productDatabase);
      cleanupCartsForProduct(oldProduct.getProductId(), Number(quantity));

      $("#admin-product-grid").empty();
      renderAdminProductCards();
      showAlert("success", "Product Updated", "The product has been updated successfully.");
      closeModal("admin-update-product-section");
    }
  });

  // Delete a product
  $(document).on("click", ".deleteProductBtn", function () {
    let deleteIndex = $(this).data("id");
    showConfirm("danger", "Delete Product", "Are you sure you want to delete this product? This cannot be undone.", function () {
      let productDatabase = getProductDatabase();
      let product = productDatabase[deleteIndex];
      cleanupCartsForProduct(product.getProductId(), 0);
      productDatabase.splice(deleteIndex, 1);
      saveProductDatabase(productDatabase);

      $("#admin-product-grid").empty();
      renderAdminProductCards();
      saveTotalProducts(getProductDatabase().length);
      $("#total-products").text(getTotalProducts());
      showAlert("success", "Product Deleted", "The product has been removed successfully.");
    });
  });

});


/* =====================
   PRODUCT SEARCH & FILTER
   ===================== */

$(document).ready(function () {

  $("#search-btn").click(function () {
    let query = $("#admin-product-search-input").val().trim().toLowerCase();
    if (!query) {
      $("#search-result-message").html("");
      searchResults = [];
      searched = false;
      $("#search-results-grid").addClass("hidden");
      $("#admin-product-grid").removeClass("hidden").hide().fadeIn(400);
      return;
    }

    searchProductsByQuery(query);
    $("#admin-category-filter-dropdown").val("");
    $("#admin-product-grid").addClass("hidden");
    $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
    $("#search-result-message").html("Showing results for : " + query);
  });

  $("#reset-icon").click(function () {
    $("#admin-product-search-input").val("");
    $("#admin-category-filter-dropdown").val("");
    $("#search-result-message").html("");
    searchResults = [];
    searched = false;
    $("#search-results-grid").empty();
    $("#search-results-grid").addClass("hidden");
    $("#admin-product-grid").removeClass("hidden").hide().fadeIn(400);
  });

  $("#admin-category-filter-dropdown").on("change", function () {
    let category = $(this).val();

    if (!searched && !category) {
      $("#search-results-grid").addClass("hidden").empty();
      $("#admin-product-grid").removeClass("hidden").hide().fadeIn(400);
      return;
    }

    filterProductsByCategory(category);
    if (!searched) {
      $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
      $("#admin-product-grid").addClass("hidden");
    } else {
      $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
    }
  });

});


/* =====================
   TRANSACTION MANAGEMENT
   ===================== */

$(document).ready(function () {

  // Clicking a transaction ID in the table fills in the input and goes to the transaction view
  $(document).on("click", ".txn-id-btn", function () {
    $("#txn-order-id-input").val($(this).data("txn-id"));
    $("#txn-order-id-error").text("");
    showView("admin-transactions-view");
    window.scrollTo(0, 0);
  });

  // Toggle the item list inside a transaction row
  $(document).on("click", ".admin-toggle-items-btn", function () {
    let targetId  = $(this).data("target");
    let targetElement = $("#" + targetId);
    if (targetElement.is(":visible")) {
      targetElement.slideUp(200);
      $(this).text($(this).text().replace("▴", "▾"));
    } else {
      targetElement.slideDown(200);
      $(this).text($(this).text().replace("▾", "▴"));
    }
  });

  // Execute a status change on a transaction
  $("#executeActionBtn").click(function () {
    let transactionIdInput = $("#txn-order-id-input").val().trim();
    let newStatus          = $("#txn-action-select").val();
    let isValid            = true;

    if (!transactionIdInput || Number.isNaN(Number(transactionIdInput))) {
      $("#txn-order-id-error").text("Please enter a valid Transaction ID.");
      isValid = false;
    } else { $("#txn-order-id-error").text(""); }

    if (!newStatus) {
      $("#txn-action-error").text("Please select an action.");
      isValid = false;
    } else { $("#txn-action-error").text(""); }

    if (!isValid) return;

    let transactionId   = Number(transactionIdInput);
    let transactionDatabase = getTransactionDatabase();
    let wasFound        = false;
    // "Denied Return" is actually stored as "Completed"
    let finalStatus     = newStatus === "Denied Return" ? "Completed" : newStatus;

    for (let index = 0; index < transactionDatabase.length; index++) {
      if (transactionDatabase[index].transactionId === transactionId) {
        transactionDatabase[index].status = finalStatus;
        wasFound = true;

        // Restore stock when an order is cancelled by admin
        if (finalStatus === "Cancelled") {
          let productDatabase = getProductDatabase();
          let items = transactionDatabase[index].items;
          for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            for (let productIndex = 0; productIndex < productDatabase.length; productIndex++) {
              if (productDatabase[productIndex].getProductId() === items[itemIndex].productId) {
                let restoredQuantity = Number(productDatabase[productIndex].getQuantityInStock()) + items[itemIndex].qty;
                productDatabase[productIndex].setQuantityInStock(restoredQuantity);
                break;
              }
            }
          }
          saveProductDatabase(productDatabase);
        }

        break;
      }
    }

    if (!wasFound) {
      $("#txn-order-id-error").text("Transaction ID not found.");
      return;
    }

    saveTransactionDatabase(transactionDatabase);
    renderAdminTransactionTables();
    updateDashboardStats();
    $("#process-transaction-form")[0].reset();
    $("#txn-action-select").css("background-color", "");
    showAlert("success", "Transaction Updated", "TXN-" + transactionId + " has been marked as: " + finalStatus);
  });

  // Reset the action dropdown color when form is cleared
  $("#clearTxnFormBtn").click(function () {
    $("#txn-action-select").css("background-color", "");
    $("#txn-order-id-error").text("");
    $("#txn-action-error").text("");
  });

  // Color code the action dropdown based on the selected action
  $("#txn-action-select").on("change", function () {
    let statusColors = {
      "Processing":        "#88f3a1",
      "Shipped":           "#cce5ff",
      "Delivered":         "#fff3cd",
      "Processing Return": "#f8d7da",
      "Issuing Refund":    "#e1a6f0",
      "Returned":          "#f8d7da",
      "Refunded":          "#e1a6f0",
      "Cancelled":         "#f5c6cb",
      "Denied Return":     "#f5c6cb"
    };
    $(this).css("background-color", statusColors[$(this).val()] || "");
  });

});


/* =====================
   ADMIN ACCOUNT MANAGEMENT
   ===================== */

$(document).ready(function () {

  $("#openAddAdminModalBtn").click(function () {
    openAddAdminModal();
  });

  $("#closeAddAdminModal").click(function () {
    closeAddAdminModal();
  });

  // Submit new admin account
  $("#addAdminBtn").click(function () {
    let name            = $("#admin-name").val().trim();
    let email           = $("#admin-email").val().trim();
    let contactNumber   = $("#admin-contact").val().trim();
    let username        = $("#admin-username").val().trim();
    let password        = $("#admin-password").val();
    let confirmPassword = $("#admin-confirm-password").val();

    if (!checkAdminAccountFields(name, email, contactNumber, username, password, confirmPassword, false)) return;

    // Check for duplicate username
    let adminDatabase = getAdminDatabase();
    let isDuplicate = false;
    for (let index = 0; index < adminDatabase.length; index++) {
      if (adminDatabase[index].getUsername() === username) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) {
      $("#admin-username-error").text("Username already exists. Please choose another.");
      return;
    }

    let newAdmin = new AdminAccount(name, email, contactNumber, username, password);
    adminDatabase.push(newAdmin);
    saveAdminDatabase(adminDatabase);
    renderAdminAccountsTable();
    closeAddAdminModal();
    showAlert("success", "Admin Account Created", "The new admin account has been created successfully.");
  });

  // Open the Edit Admin modal
  $(document).on("click", ".editAdminBtn", function () {
    openEditAdminModal($(this).data("username"));
  });

  $("#closeEditAdminModal").click(function () {
    closeEditAdminModal();
  });

  // Save changes to an existing admin account
  $("#saveEditAdminBtn").click(function () {
    let originalUsername = $(this).data("username");
    let name             = $("#edit-admin-name").val().trim();
    let email            = $("#edit-admin-email").val().trim();
    let contactNumber    = $("#edit-admin-contact").val().trim();
    let username         = $("#edit-admin-username").val().trim();

    if (!checkAdminAccountFields(name, email, contactNumber, username, null, null, true)) return;

    // Allow keeping the same username; block any other duplicate
    let adminDatabase = getAdminDatabase();
    let isDuplicate = false;
    for (let index = 0; index < adminDatabase.length; index++) {
      if (adminDatabase[index].getUsername() === username && adminDatabase[index].getUsername() !== originalUsername) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) {
      $("#edit-admin-username-error").text("Username already exists. Please choose another.");
      return;
    }

    for (let index = 0; index < adminDatabase.length; index++) {
      if (adminDatabase[index].getUsername() === originalUsername) {
        adminDatabase[index].setName(name);
        adminDatabase[index].setEmail(email);
        adminDatabase[index].setContactNumber(contactNumber);
        adminDatabase[index].setUsername(username);
        saveAdminDatabase(adminDatabase);

        // If this is the currently logged-in admin, update the session too
        let loggedInAdmin = getLoggedInAdmin();
        if (loggedInAdmin && loggedInAdmin.getUsername() === originalUsername) {
          adminDatabase[index].setPassword(loggedInAdmin.getPassword());
          saveLoggedInAdmin(adminDatabase[index]);
          displayLoggedInAdmin();
        }
        break;
      }
    }

    renderAdminAccountsTable();
    closeEditAdminModal();
    showAlert("success", "Admin Account Updated", "The admin account has been updated successfully.");
  });

  // Delete an admin account
  $(document).on("click", ".deleteAdminBtn", function () {
    let username = $(this).data("username");
    showConfirm("danger", "Delete Admin Account", "Are you sure you want to delete the account for \"" + username + "\"? This cannot be undone.", function () {
      let adminDatabase = getAdminDatabase();
      let updatedDatabase = [];
      for (let index = 0; index < adminDatabase.length; index++) {
        if (adminDatabase[index].getUsername() !== username) updatedDatabase.push(adminDatabase[index]);
      }
      saveAdminDatabase(updatedDatabase);
      renderAdminAccountsTable();
      showAlert("info", "Account Deleted", "The admin account has been removed.");
    });
  });

  $(document).on("click", ".password-toggle-btn", function () {
    showHidePassword($(this).prev(), $(this));
  });

});


/* =====================
   INITIALIZATION
   ===================== */

$(document).ready(function () {

  // Redirect to login if not authenticated
  if (!getIsAdminLoggedIn()) {
    location.replace("../html/auth.html");
  }

  let productDatabase = getProductDatabase();
  $("#total-products").text(productDatabase.length);
  saveTotalProducts(productDatabase.length);

  renderAdminProductCards();
  displayLoggedInAdmin();
  renderAdminAccountsTable();
  renderAdminTransactionTables();
  updateDashboardStats();

  // Wipe all localStorage data (for testing/resetting)
  $("#clearStorageBtn").click(function () {
    showConfirm("danger", "Clear All Data", "This will wipe everything: customers, products, transactions, all sessions. The page will reload.", function () {
      localStorage.clear();
      location.reload();
    });
  });

});
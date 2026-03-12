/* admin.js - Admin page script. Depends on: shared.js */

/* ---- SUB-VIEW NAVIGATION ---- */

function showView(viewId) {
  $(".sub-section").addClass("hidden");
  $("#" + viewId).removeClass("hidden").hide().fadeIn(400);
  $(".nav-link, .sidebar-nav a").removeClass("active");
  $("a[onclick*=\"'" + viewId + "'\"]").addClass("active");
  window.scrollTo(0, 0);
  return false;
}

/* ---- ADMIN ACCOUNT HELPERS ---- */

function displayLoggedInAdmin() {
  let admin = getLoggedInAdmin();
  if (!admin) return;
  $("#loggedin-admin-name").text(admin.getName());
  $("#loggedin-admin-username").text("@" + admin.getUsername());
  $("#loggedin-admin-email").text(admin.getEmail());
  $("#loggedin-admin-contact").text(admin.getContactNumber());
}

function renderAdminAccountsTable() {
  let adminDB = getAdminDatabase();
  let loggedIn = getLoggedInAdmin();
  $("#admin-accounts-tbody").empty();

  if (adminDB.length === 0) {
    $("#admin-accounts-tbody").html('<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">No admin accounts found.</td></tr>');
    return;
  }

  for (let i = 0; i < adminDB.length; i++) {
    let admin = adminDB[i];
    let isCurrentUser = loggedIn && admin.getUsername() === loggedIn.getUsername();
    let badgeHtml = isCurrentUser ? ' <span style="font-size:.7rem;background:var(--accent-pale);color:var(--accent-dark);padding:2px 8px;border-radius:100px;font-weight:500;">You</span>' : "";
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

function checkAdminAccountFields(name, email, contactNumber, username, password, confirmPassword, isEdit) {
  let valid = true;

  let nameErrorId      = isEdit ? "#edit-admin-name-error"     : "#admin-name-error";
  let emailErrorId     = isEdit ? "#edit-admin-email-error"    : "#admin-email-error";
  let contactErrorId   = isEdit ? "#edit-admin-contact-error"  : "#admin-contact-error";
  let usernameErrorId  = isEdit ? "#edit-admin-username-error" : "#admin-username-error";

  if (!name || name.length < 3) {
    $(nameErrorId).text("Full name is required and must be at least 3 characters.");
    valid = false;
  } else { $(nameErrorId).text(""); }

  let atIndex = email.indexOf("@"), dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex || email.includes(" ") || !email.endsWith(".com")) {
    $(emailErrorId).text("Email is required and must be valid.");
    valid = false;
  } else { $(emailErrorId).text(""); }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $(contactErrorId).text("Contact number is required, must be at least 8 digits, and valid.");
    valid = false;
  } else { $(contactErrorId).text(""); }

  if (!username || username.length < 3 || username.length > 20 || username.includes(" ")) {
    $(usernameErrorId).text("Username must be 3–20 characters with no spaces.");
    valid = false;
  } else { $(usernameErrorId).text(""); }

  if (!isEdit) {
    if (!password || password.length < 8) {
      $("#admin-password-error").text("Password is required and must be at least 8 characters.");
      valid = false;
    } else { $("#admin-password-error").text(""); }

    if (password !== confirmPassword) {
      $("#admin-confirm-password-error").text("Passwords do not match.");
      valid = false;
    } else if (password && password.length >= 8) {
      $("#admin-confirm-password-error").text("");
    }
  }

  return valid;
}

/* ---- MODAL HELPERS ---- */

function openModal(modalId) {
  $(".modal-backdrop").removeClass("hidden").hide().fadeIn(300);
  $("#" + modalId).css("display", "block").hide().fadeIn(300);
}

function closeModal(modalId) {
  $(".modal-backdrop").fadeOut(200);
  $("#" + modalId).fadeOut(200);
}

function openAddProductModal() {
  openModal("add-product-modal");
}
function closeAddProductModal() {
  closeModal("add-product-modal");
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
  let adminDB = getAdminDatabase();
  let target = null;
  for (let i = 0; i < adminDB.length; i++) {
    if (adminDB[i].getUsername() === username) { target = adminDB[i]; break; }
  }
  if (!target) return;

  $("#edit-admin-name").val(target.getName());
  $("#edit-admin-email").val(target.getEmail());
  $("#edit-admin-contact").val(target.getContactNumber());
  $("#edit-admin-username").val(target.getUsername());
  $(".validation-msg", "#edit-admin-form").text("");
  $("#saveEditAdminBtn").data("username", username);
  openModal("edit-admin-modal");
}
function closeEditAdminModal() {
  closeModal("edit-admin-modal");
}

/* ---- PRODUCT HELPERS ---- */

function generateAdminProductCard(product, index) {
  if (!product) return "";
  let id = product.getProductId(), category = product.getCategory();
  let name = product.getProductName(), description = product.getDescription();
  let quantity = product.getQuantityInStock(), price = product.getPrice();
  let imageUrl = product.getImageUrl();
  let parts = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0], label = parts[1];
  return '<article class="product-card">'
    + '<div class="product-img-wrap">'
    + '<div class="product-img-placeholder hidden">' + iconHtml + '<span>' + label + '</span></div>'
    + '<img src="' + imageUrl + '" class="product-img" onerror="this.style.display=\'none\';this.previousElementSibling.classList.remove(\'hidden\');">'
    + '</div>'
    + '<div class="product-body">'
    + '<div class="product-category">ID: ' + id + ' - ' + label + '</div>'
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

function checkProductFields(element, category, productName, description, quantity, price) {
  let returnValue = true;
  if (!category) { element.querySelectorAll(".validation-msg")[0].textContent = "Please select a category."; returnValue = false; }
  else { element.querySelectorAll(".validation-msg")[0].textContent = ""; }
  if (!productName || productName.length < 3) { element.querySelectorAll(".validation-msg")[1].textContent = "Product name must be at least 3 characters."; returnValue = false; }
  else { element.querySelectorAll(".validation-msg")[1].textContent = ""; }
  if (!description || description.length < 10) { element.querySelectorAll(".validation-msg")[2].textContent = "Description must be at least 10 characters."; returnValue = false; }
  else { element.querySelectorAll(".validation-msg")[2].textContent = ""; }
  if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) < 0) { element.querySelectorAll(".validation-msg")[3].textContent = "Quantity must be a positive number."; returnValue = false; }
  else { element.querySelectorAll(".validation-msg")[3].textContent = ""; }
  if (!price || Number.isNaN(Number(price)) || Number(price) < 0) { element.querySelectorAll(".validation-msg")[4].textContent = "Price must be a positive number."; returnValue = false; }
  else { element.querySelectorAll(".validation-msg")[4].textContent = ""; }
  return returnValue;
}

/* ---- CART CLEANUP ----
   When a product is updated or deleted by admin, we loop through every customer's
   cart in customerDatabase and either update the stock value or remove the item entirely.
   We read/write the raw JSON array directly to avoid getCustomerDatabase() crashing on null entries.
*/

function cleanupCartsForProduct(productId, newQuantity) {
  // newQuantity = 0 means deleted — remove from all carts
  // newQuantity > 0 means updated — update quantityInStock in all carts

  let rawDB = JSON.parse(localStorage.getItem("customerDatabase"));
  if (!rawDB) return;

  $.each(rawDB, function (i, obj) {
    if (!obj || !obj.cart) return;

    let updatedCart = [];

    $.each(obj.cart, function (j, cartItem) {
      if (cartItem.productId !== productId) {
        // not this product, keep it as is
        updatedCart.push(cartItem);
      } else if (newQuantity > 0) {
        // product still exists, update its stock and cap qty if needed
        cartItem.quantityInStock = newQuantity;
        if (cartItem.qty > newQuantity) {
          cartItem.qty = newQuantity;
        }
        updatedCart.push(cartItem);
      }
      // if newQuantity is 0, we just skip it — effectively removing it
    });

    rawDB[i].cart = updatedCart;
  });

  localStorage.setItem("customerDatabase", JSON.stringify(rawDB));

  // if the currently logged-in customer is affected, update their session too
  let loggedIn = JSON.parse(localStorage.getItem("loggedInCustomer"));
  if (!loggedIn || !loggedIn.cart) return;

  let updatedLoggedInCart = [];

  $.each(loggedIn.cart, function (j, cartItem) {
    if (cartItem.productId !== productId) {
      updatedLoggedInCart.push(cartItem);
    } else if (newQuantity > 0) {
      cartItem.quantityInStock = newQuantity;
      if (cartItem.qty > newQuantity) {
        cartItem.qty = newQuantity;
      }
      updatedLoggedInCart.push(cartItem);
    }
  });

  loggedIn.cart = updatedLoggedInCart;
  localStorage.setItem("loggedInCustomer", JSON.stringify(loggedIn));
}

let searchResults = [];
let searched = false;

function searchProductsByQuery(query) {
  let products = getProductDatabase();

  if (!query || products.length == 0) { return; }

  searchResults = [];
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let name = product.getProductName().toLowerCase();
    let description = product.getDescription().toLowerCase();

    if ((name.includes(query) || description.includes(query))) {
      $("#search-results-grid").append(generateAdminProductCard(product, index));
      searchResults.push(product);
    }
  });

  searched = true;
}

function filterProductsByCategory(filter) {
  let products = searched ? searchResults : getProductDatabase();

  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    if (product.getCategory().includes(filter)) {
      $("#search-results-grid").append(generateAdminProductCard(product, index));
    }
  });
}

/* ---- EVENTS ---- */

$(document).ready(function () {

  /* Logout */
  $("#logoutBtn, #logoutBtnSidebar").click(function () {
    showConfirm("warning", "Log Out", "Are you sure you want to log out?", function () {
      saveIsAdminLoggedIn(false);
      location.replace("../html/auth.html");
    });
  });

  /* Add Product — open modal trigger */
  $("#openAddProductModalBtn").click(function () {
    openAddProductModal();
  });

  /* Close Add Product Modal */
  $("#closeAddProductModal").click(function () {
    closeAddProductModal();
    $("#add-product-form")[0].reset();
    $(".validation-msg", "#add-product-form").text("");
  });

  /* Add Product */
  $("#addProductBtn").click(function () {
    let category = $("#product-category").val().trim();
    let productName = $("#product-name").val().trim();
    let description = $("#product-description").val().trim();
    let quantity = $("#product-quantity").val().trim();
    let price = $("#product-price").val().trim();
    let imageUrl = $("#product-image-url").val().trim();
    let $adminProductForm = $("#add-product-form")[0];

    if (checkProductFields($adminProductForm, category, productName, description, quantity, price)) {
      let prodId = getProductIdCounter();
      let product = new Product(prodId, category, productName, description, quantity, price, imageUrl);
      let productDB = getProductDatabase();
      let index = productDB.length;
      productDB.push(product);
      saveProductDatabase(productDB);
      saveProductIdCounter(++prodId);
      saveTotalProducts(getProductDatabase().length);
      $("#total-products").text(getTotalProducts());
      $("#clearAddProductForm").click();
      $("#admin-product-grid").append(generateAdminProductCard(product, index));
      closeAddProductModal();
      showAlert("success", "Product Added", "The product has been added successfully.");
    }
  });

  /* Open Edit Product Modal */
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

  /* Close Edit Product Modal */
  $(document).on("click", ".modal-backdrop", function () {
    $(".modal").each(function () {
      if ($(this).is(":visible")) {
        $(this).fadeOut(200);
      }
    });
    $(".modal-backdrop").fadeOut(200);
  });

  $("#closeUpdateModal").click(function () {
    closeModal("admin-update-product-section");
  });

  /* Update Product */
  $("#updateProductBtn").on("click", function () {
    let category = $("#update-product-category").val().trim();
    let productName = $("#update-product-name").val().trim();
    let description = $("#update-product-description").val().trim();
    let quantity = $("#update-product-quantity").val().trim();
    let price = $("#update-product-price").val().trim();
    let imageUrl = $("#update-product-image-url").val().trim();
    let $updateProductForm = $("#update-product-form")[0];

    if (checkProductFields($updateProductForm, category, productName, description, quantity, price)) {
      let id = Number($(this).data("id"));
      let productDB = getProductDatabase();
      let product = productDB[id];
      let updatedProduct = new Product(product.getProductId(), category, productName, description, quantity, price, imageUrl);
      productDB[id] = updatedProduct;

      saveProductDatabase(productDB);

      // update or remove this product from all customer carts
      cleanupCartsForProduct(product.getProductId(), Number(quantity));

      $("#admin-product-grid").empty();
      renderAdminProductCards();
      showAlert("success", "Product Updated", "The product has been updated successfully.");

      closeModal("admin-update-product-section");
    }
  });

  /* Delete Product */
  $(document).on("click", ".deleteProductBtn", function () {
    let deleteIndex = $(this).data("id");
    showConfirm("danger", "Delete Product", "Are you sure you want to delete this product? This cannot be undone.", function () {
      let productDB = getProductDatabase();
      let product = productDB[deleteIndex];
      cleanupCartsForProduct(product.getProductId(), 0);
      productDB.splice(deleteIndex, 1);
      saveProductDatabase(productDB);
      $("#admin-product-grid").empty();
      renderAdminProductCards();
      saveTotalProducts(getProductDatabase().length);
      $("#total-products").text(getTotalProducts());
      showAlert("success", "Product Deleted", "The product has been removed successfully.");
    });
  });

  /* ---- TRANSACTION EVENTS ---- */

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

  function generateAdminItemsCollapsible(items, txnId) {
    let listHtml = '<ul style="margin:6px 0 0 12px;padding:0;">';
    for (let i = 0; i < items.length; i++) {
      listHtml += '<li style="font-size:.82rem;color:var(--ink-soft);padding:2px 0;">'
        + items[i].productName + ' &times;' + items[i].qty + '</li>';
    }
    listHtml += '</ul>';
    return '<div>'
      + '<button type="button" class="btn btn-outline btn-sm admin-toggle-items-btn" data-target="admin-items-' + txnId + '" style="font-size:.75rem;padding:4px 10px;">'
      + items.length + ' item' + (items.length > 1 ? 's' : '') + ' ▾</button>'
      + '<div id="admin-items-' + txnId + '" style="display:none;">' + listHtml + '</div>'
      + '</div>';
  }

  function renderAdminTransactionTables() {
    let allTxns    = getTransactionDatabase();
    let processing = [];
    let completed  = [];

    for (let i = 0; i < allTxns.length; i++) {
      let t = allTxns[i];
      if (ADMIN_ONGOING_STATUSES.indexOf(t.status) !== -1) {
        processing.push(t);
      } else {
        completed.push(t);
      }
    }

    // Processing table
    let processingHtml = "";
    if (processing.length === 0) {
      processingHtml = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">No active orders.</td></tr>';
    } else {
      for (let i = 0; i < processing.length; i++) {
        let t = processing[i];
        processingHtml += '<tr>'
          + '<td><button type="button" class="btn btn-outline btn-sm txn-id-btn" data-txn-id="' + t.transactionId + '" style="font-family:monospace;">TXN-' + t.transactionId + '</button></td>'
          + '<td>' + t.customerName + '<br><span style="font-size:.78rem;color:#aaa;">@' + t.customerUsername + '</span></td>'
          + '<td>' + generateAdminItemsCollapsible(t.items, "proc-" + t.transactionId) + '</td>'
          + '<td style="font-weight:600;">&#8369;' + t.total + '</td>'
          + '<td>' + (ADMIN_PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod) + '</td>'
          + '<td>' + (ADMIN_DELIVERY_LABELS[t.deliveryMethod] || t.deliveryMethod) + '</td>'
          + '<td><span class="status-badge ' + getAdminStatusBadgeClass(t.status) + '">● ' + t.status + '</span></td>'
          + '</tr>';
      }
    }
    $("#admin-processing-tbody").html(processingHtml);

    // Completed table
    let completedHtml = "";
    if (completed.length === 0) {
      completedHtml = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">No completed orders yet.</td></tr>';
    } else {
      for (let i = 0; i < completed.length; i++) {
        let t = completed[i];
        completedHtml += '<tr>'
          + '<td><span class="order-id" style="font-family:monospace;">TXN-' + t.transactionId + '</span></td>'
          + '<td>' + t.customerName + '<br><span style="font-size:.78rem;color:#aaa;">@' + t.customerUsername + '</span></td>'
          + '<td>' + generateAdminItemsCollapsible(t.items, "comp-" + t.transactionId) + '</td>'
          + '<td style="font-weight:600;">&#8369;' + t.total + '</td>'
          + '<td>' + (ADMIN_PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod) + '</td>'
          + '<td>' + (ADMIN_DELIVERY_LABELS[t.deliveryMethod] || t.deliveryMethod) + '</td>'
          + '<td><span class="status-badge ' + getAdminStatusBadgeClass(t.status) + '">● ' + t.status + '</span></td>'
          + '</tr>';
      }
    }
    $("#admin-completed-tbody").html(completedHtml);
  }

  function updateDashboardStats() {
    let txnDB = getTransactionDatabase();
    let revenue = 0;
    let pendingReturns = 0;
    let totalOrders = txnDB.length;

    for (let i = 0; i < txnDB.length; i++) {
      let t = txnDB[i];
      if (t.status === "Completed") {
        revenue += Number(t.total);
      }
      if (t.status === "Processing Return" || t.status === "Issuing Refund") {
        pendingReturns++;
      }
    }

    $("#total-orders").text(totalOrders);
    $("#total-revenue").text("₱" + revenue);
    $("#pending-returns").text(pendingReturns);
  }
  $(document).on("click", ".txn-id-btn", function () {
    $("#txn-order-id-input").val($(this).data("txn-id"));
    $("#txn-order-id-error").text("");
    showView("admin-transactions-view");
    window.scrollTo(0, 0);
  });

  /* Collapsible items toggle */
  $(document).on("click", ".admin-toggle-items-btn", function () {
    let targetId = $(this).data("target");
    let el = $("#" + targetId);
    if (el.is(":visible")) {
      el.slideUp(200);
      $(this).text($(this).text().replace("▴", "▾"));
    } else {
      el.slideDown(200);
      $(this).text($(this).text().replace("▾", "▴"));
    }
  });

  /* Execute Action */
  $("#executeActionBtn").click(function () {
    let txnIdInput = $("#txn-order-id-input").val().trim();
    let newStatus  = $("#txn-action-select").val();
    let valid = true;

    if (!txnIdInput || Number.isNaN(Number(txnIdInput))) {
      $("#txn-order-id-error").text("Please enter a valid Transaction ID.");
      valid = false;
    } else { $("#txn-order-id-error").text(""); }

    if (!newStatus) {
      $("#txn-action-error").text("Please select an action.");
      valid = false;
    } else { $("#txn-action-error").text(""); }

    if (!valid) return;

    let txnId = Number(txnIdInput);
    let txnDB = getTransactionDatabase();
    let found = false;
    let finalStatus = newStatus === "Denied Return" ? "Completed" : newStatus;

    for (let i = 0; i < txnDB.length; i++) {
      if (txnDB[i].transactionId === txnId) {
        txnDB[i].status = finalStatus;
        found = true;

        // recover stock if admin cancels
        if (finalStatus === "Cancelled") {
          let productDB = getProductDatabase();
          let items = txnDB[i].items;
          for (let j = 0; j < items.length; j++) {
            for (let k = 0; k < productDB.length; k++) {
              if (productDB[k].getProductId() === items[j].productId) {
                let recovered = Number(productDB[k].getQuantityInStock()) + items[j].qty;
                productDB[k].setQuantityInStock(recovered);
                break;
              }
            }
          }
          saveProductDatabase(productDB);
        }

        break;
      }
    }

    if (!found) {
      $("#txn-order-id-error").text("Transaction ID not found.");
      return;
    }

    saveTransactionDatabase(txnDB);
    renderAdminTransactionTables();
    updateDashboardStats();
    $("#process-transaction-form")[0].reset();
    $("#txn-action-select").css("background-color", "");
    showAlert("success", "Transaction Updated", "TXN-" + txnId + " has been marked as: " + finalStatus);
  });

  /* Clear button resets colour */
  $("#clearTxnFormBtn").click(function () {
    $("#txn-action-select").css("background-color", "");
    $("#txn-order-id-error").text("");
    $("#txn-action-error").text("");
  });

  /* Action select colour coding */
  $("#txn-action-select").on("change", function () {
    let colors = {
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
    $(this).css("background-color", colors[$(this).val()] || "");
  });

  /* Search */
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
      $("#search-results-grid").addClass("hidden");
      $("#search-results-grid").empty();
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

  /* ---- ADMIN ACCOUNT EVENTS ---- */

  /* Open Add Admin Modal */
  $("#openAddAdminModalBtn").click(function () {
    openAddAdminModal();
  });

  /* Close Add Admin Modal */
  $("#closeAddAdminModal").click(function () {
    closeAddAdminModal();
  });

  /* Add Admin */
  $("#addAdminBtn").click(function () {
    let name           = $("#admin-name").val().trim();
    let email          = $("#admin-email").val().trim();
    let contactNumber  = $("#admin-contact").val().trim();
    let username       = $("#admin-username").val().trim();
    let password       = $("#admin-password").val();
    let confirmPassword = $("#admin-confirm-password").val();

    if (!checkAdminAccountFields(name, email, contactNumber, username, password, confirmPassword, false)) return;

    // check duplicate username across admins
    let adminDB = getAdminDatabase();
    let duplicate = false;
    for (let i = 0; i < adminDB.length; i++) {
      if (adminDB[i].getUsername() === username) { duplicate = true; break; }
    }
    if (duplicate) {
      $("#admin-username-error").text("Username already exists. Please choose another.");
      return;
    }

    let newAdmin = new AdminAccount(name, email, contactNumber, username, password);
    adminDB.push(newAdmin);
    saveAdminDatabase(adminDB);
    renderAdminAccountsTable();
    closeAddAdminModal();
    showAlert("success", "Admin Account Created", "The new admin account has been created successfully.");
  });

  /* Open Edit Admin Modal */
  $(document).on("click", ".editAdminBtn", function () {
    openEditAdminModal($(this).data("username"));
  });

  /* Close Edit Admin Modal */
  $("#closeEditAdminModal").click(function () {
    closeEditAdminModal();
  });

  /* Save Edit Admin */
  $("#saveEditAdminBtn").click(function () {
    let originalUsername = $(this).data("username");
    let name          = $("#edit-admin-name").val().trim();
    let email         = $("#edit-admin-email").val().trim();
    let contactNumber = $("#edit-admin-contact").val().trim();
    let username      = $("#edit-admin-username").val().trim();

    if (!checkAdminAccountFields(name, email, contactNumber, username, null, null, true)) return;

    // check duplicate username — allow keeping own username
    let adminDB = getAdminDatabase();
    let duplicate = false;
    for (let i = 0; i < adminDB.length; i++) {
      if (adminDB[i].getUsername() === username && adminDB[i].getUsername() !== originalUsername) {
        duplicate = true; break;
      }
    }
    if (duplicate) {
      $("#edit-admin-username-error").text("Username already exists. Please choose another.");
      return;
    }

    for (let i = 0; i < adminDB.length; i++) {
      if (adminDB[i].getUsername() === originalUsername) {
        adminDB[i].setName(name);
        adminDB[i].setEmail(email);
        adminDB[i].setContactNumber(contactNumber);
        adminDB[i].setUsername(username);
        saveAdminDatabase(adminDB);

        let loggedIn = getLoggedInAdmin();
        if (loggedIn && loggedIn.getUsername() === originalUsername) {
          adminDB[i].setPassword(loggedIn.getPassword());
          saveLoggedInAdmin(adminDB[i]);
          displayLoggedInAdmin();
        }
        break;
      }
    }

    renderAdminAccountsTable();
    closeEditAdminModal();
    showAlert("success", "Admin Account Updated", "The admin account has been updated successfully.");
  });

  /* Delete Admin */
  $(document).on("click", ".deleteAdminBtn", function () {
    let username = $(this).data("username");
    showConfirm("danger", "Delete Admin Account", "Are you sure you want to delete the account for \"" + username + "\"? This cannot be undone.", function () {
      let adminDB = getAdminDatabase();
      let updated = [];
      for (let i = 0; i < adminDB.length; i++) {
        if (adminDB[i].getUsername() !== username) updated.push(adminDB[i]);
      }
      saveAdminDatabase(updated);
      renderAdminAccountsTable();
      showAlert("info", "Account Deleted", "The admin account has been removed.");
    });
  });

  /* Password toggle inside modals */
  $(document).on("click", ".password-toggle-btn", function () {
    showHidePassword($(this).prev(), $(this));
  });

  /* Init */
  if (!getIsAdminLoggedIn()) {
    location.replace("../html/auth.html");
  }

  let productDB = getProductDatabase();
  $("#total-products").text(productDB.length);
  saveTotalProducts(productDB.length);
  renderAdminProductCards();
  displayLoggedInAdmin();
  renderAdminAccountsTable();
  renderAdminTransactionTables();
  updateDashboardStats();

  /* Clear Storage */
  $("#clearStorageBtn").click(function () {
    showConfirm("danger", "Clear All Data", "This will wipe everything: customers, products, transactions, all sessions. The page will reload.", function () {
      localStorage.clear();
      location.reload();
    });
  });

});
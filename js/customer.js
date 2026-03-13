/* customer.js — Customer page logic. Requires: shared.js */


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
   PRODUCT CARD HELPERS
   ===================== */

function generateCustomerProductCard(product, index) {
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
    + '<div class="product-category">' + label + '</div>'
    + '<h3 class="product-name">' + name + '</h3>'
    + '<p class="product-desc">' + description + '</p>'
    + '<p style="font-size: 0.8em">Available Stock: ' + quantity + '</p>'
    + '<div class="product-footer">'
    + '<div class="product-price">&#8369;' + price + '</div>'
    + '<button type="button" class="btn btn-accent btn-sm add-to-cart" data-id="' + index + '">+ Cart</button>'
    + '</div></div></article>';
}

function renderCustomerProductCards() {
  let cartArray = getCartArray();

  // Track which product IDs are already in the cart to disable their buttons
  let addedProductIds = [];
  $.each(cartArray, function (index, cartItem) {
    addedProductIds.push(cartItem.productId);
  });

  $.each(getProductDatabase(), function (index, product) {
    if (product.getQuantityInStock() > 0) {
      $("#customer-product-grid").append(generateCustomerProductCard(product, index));

      if (addedProductIds.indexOf(product.getProductId()) !== -1) {
        $("#customer-product-grid .add-to-cart[data-id='" + index + "']")
          .attr("disabled", true).text("Added")
          .removeClass("btn-accent").addClass("btn-secondary");
      }
    }
  });
}


/* =====================
   CART HELPERS
   ===================== */

// Account.getCart() rebuilds Product objects which drops extra fields like qty.
// So we read the raw cart array directly from localStorage instead.

function getCartArray() {
  let customer = getLoggedInCustomer();
  if (!customer) return [];
  return customer.getRawCart() || [];
}

function saveCartArray(cartArray) {
  let customer = getLoggedInCustomer();
  customer.setCart(cartArray);
  saveLoggedInCustomer(customer);

  // Also update the customer entry inside the main customer database
  let customerDatabase = getCustomerDatabase();
  for (let index = 0; index < customerDatabase.length; index++) {
    if (customerDatabase[index].getUsername() === customer.getUsername()) {
      customerDatabase[index].setCart(cartArray);
      saveCustomerDatabase(customerDatabase);
      break;
    }
  }
}

function addToCart(product) {
  let cartArray = getCartArray();

  let cartItem = {
    productId:       product.getProductId(),
    category:        product.getCategory(),
    productName:     product.getProductName(),
    description:     product.getDescription(),
    quantityInStock: product.getQuantityInStock(),
    price:           product.getPrice(),
    imageUrl:        product.getImageUrl(),
    qty: 1
  };

  cartArray.push(cartItem);
  saveCartArray(cartArray);

  // Remove the "cart is empty" message if it's showing
  $("#cart-items p").remove();

  // Append just the new item so the cart updates live without a full re-render
  let newIndex = cartArray.length - 1;
  $("#cart-items").append(generateCartItemCard(cartItem, newIndex));
}


/* =====================
   CART RENDERING
   ===================== */

function generateCartItemCard(cartItem, cartIndex) {
  let quantity    = cartItem.qty || 1;
  let stock       = cartItem.quantityInStock || 0;
  let price       = cartItem.price;
  let name        = cartItem.productName;
  let description = cartItem.description;
  let imageUrl    = cartItem.imageUrl;
  let category    = cartItem.category;
  let lineTotal   = price * quantity;

  let parts    = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0];
  let label    = parts[1];

  let decreaseDisabled = quantity <= 1    ? "disabled" : "";
  let increaseDisabled = quantity >= stock ? "disabled" : "";

  return `<div class="cart-item" id="cart-item-${cartIndex}" data-price="${price}" data-stock="${stock}">
    <input type="checkbox" class="cart-item-checkbox" />
    <div class="cart-item-img">
      <div class="product-img-placeholder hidden">${iconHtml}<span>${label}</span></div>
      <img src="${imageUrl}" class="product-img" onerror="this.style.display='none';this.previousElementSibling.classList.remove('hidden');">
    </div>
    <div class="cart-item-details">
      <div class="cart-item-name">${name}</div>
      <div class="cart-item-meta">${description}</div>
      <div class="qty-control">
        <button type="button" class="qty-btn" data-action="decrease" data-item-index="${cartIndex}" ${decreaseDisabled}>–</button>
        <div class="qty-value" id="qty-value-${cartIndex}">${quantity}</div>
        <button type="button" class="qty-btn" data-action="increase" data-item-index="${cartIndex}" ${increaseDisabled}>+</button>
      </div>
      <div style="font-size:0.75em;color:#888;margin-top:4px;">${stock} in stock</div>
    </div>
    <div class="cart-item-price">&#8369;<span id="line-total-${cartIndex}">${lineTotal}</span></div>
    <button type="button" class="cart-item-remove-btn" data-index="${cartIndex}">✕</button>
  </div>`;
}

function displayCartItems() {
  let cartArray = getCartArray();
  $("#cart-items").empty();

  if (cartArray.length === 0) {
    $("#cart-items").html('<p style="padding:16px;color:#888;">Your cart is empty.</p>');
    recalculateTotal();
    return;
  }

  $.each(cartArray, function (index, cartItem) {
    $("#cart-items").append(generateCartItemCard(cartItem, index));
  });

  recalculateTotal();
}

// Adds up the totals of all checked cart items and updates the display
function recalculateTotal() {
  let total = 0;

  $("#cart-items .cart-item").each(function () {
    if (!$(this).find(".cart-item-checkbox").prop("checked")) return;

    let itemIndex = $(this).attr("id").replace("cart-item-", "");
    let price     = parseFloat($(this).data("price")) || 0;
    let quantity  = parseInt($("#qty-value-" + itemIndex).text()) || 1;
    total += price * quantity;
  });

  $(".cart-selected-amount").html("&#8369;" + total);
}


/* =====================
   CHECKOUT HELPERS
   ===================== */

const SHIPPING_COSTS = { standard: 150, express: 350, sameday: 500 };
const DELIVERY_LABELS = { standard: "Standard (3–5 days)", express: "Express (1–2 days)", sameday: "Same Day" };
const PAYMENT_LABELS  = { cod: "Cash on Delivery", gcash: "GCash", maya: "Maya", card: "Debit/Credit Card" };
const PAYMENT_ICONS   = {
  cod:   '<i class="fa-solid fa-money-bill-wave" style="font-size:2.2rem;color:#2E9E5E;"></i>',
  card:  '<i class="fa-solid fa-credit-card"     style="font-size:2.2rem;color:#1D4ED8;"></i>',
  gcash: '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/GCash_logo.svg/250px-GCash_logo.svg.png" style="height:40px;object-fit:contain;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'"><i class="fa-solid fa-mobile-screen-button" style="display:none;font-size:2.2rem;color:#007DFF;"></i>',
  maya:  '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Maya_%28payment_service%29_logo.svg/250px-Maya_%28payment_service%29_logo.svg.png" style="height:40px;object-fit:contain;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'"><i class="fa-solid fa-mobile-screen-button" style="display:none;font-size:2.2rem;color:#2ECC71;"></i>'
};

function getCheckedCartItems() {
  let checkedItems = [];
  $("#cart-items .cart-item").each(function () {
    if (!$(this).find(".cart-item-checkbox").prop("checked")) return;

    let itemIndex = $(this).attr("id").replace("cart-item-", "");
    let cartArray = getCartArray();

    if (cartArray[itemIndex]) {
      let item     = cartArray[itemIndex];
      let quantity = parseInt($("#qty-value-" + itemIndex).text()) || 1;
      checkedItems.push({
        productId:   item.productId,
        productName: item.productName,
        price:       item.price,
        qty:         quantity,
        category:    item.category,
        imageUrl:    item.imageUrl
      });
    }
  });
  return checkedItems;
}

function updateCheckoutSummary() {
  let checkedItems    = getCheckedCartItems();
  let subtotal        = 0;
  for (let index = 0; index < checkedItems.length; index++) {
    subtotal += parseFloat(checkedItems[index].price) * checkedItems[index].qty;
  }

  let deliveryOption = $("#checkout-delivery-option").val() || "standard";
  let shippingCost   = SHIPPING_COSTS[deliveryOption] || 150;

  let itemsHtml = "";
  if (checkedItems.length === 0) {
    itemsHtml = '<p style="font-size:.85rem;color:#888;margin-bottom:8px;">No items selected.</p>';
  } else {
    for (let index = 0; index < checkedItems.length; index++) {
      let item = checkedItems[index];
      itemsHtml += '<div class="cart-summary-row" style="font-size:.85rem;">'
        + '<span>' + item.productName + ' &times;' + item.qty + '</span>'
        + '<span>&#8369;' + (parseFloat(item.price) * item.qty) + '</span>'
        + '</div>';
    }
  }

  $("#checkout-items-list").html(itemsHtml);
  $("#checkout-subtotal").text(subtotal);
  $("#checkout-shipping").text(shippingCost);
  $("#checkout-total").text(subtotal + shippingCost);
}

function openCheckoutModal() {
  $("#checkout-modal-backdrop").css("display", "block").hide().fadeIn(300);
  $("#checkout-modal").css("display", "block").hide().fadeIn(300);
}

function closeCheckoutModal() {
  $("#checkout-modal-backdrop").fadeOut(200);
  $("#checkout-modal").fadeOut(200);
}

function openPaymentConfirmModal() {
  let checkedItems   = getCheckedCartItems();
  let deliveryOption = $("#checkout-delivery-option").val() || "standard";
  let paymentMethod  = $("#checkout-payment-method").val();

  let subtotal = 0;
  for (let index = 0; index < checkedItems.length; index++) {
    subtotal += parseFloat(checkedItems[index].price) * checkedItems[index].qty;
  }

  let shippingCost = SHIPPING_COSTS[deliveryOption] || 150;
  let total        = subtotal + shippingCost;
  let iconHtml     = PAYMENT_ICONS[paymentMethod] || '<i class="fa-solid fa-wallet" style="font-size:2.2rem;"></i>';

  let itemLines = "";
  for (let index = 0; index < checkedItems.length; index++) {
    itemLines += '<li style="font-size:.85rem;color:var(--ink-soft);padding:3px 0;">'
      + checkedItems[index].productName + ' <span style="color:#aaa;">&times;' + checkedItems[index].qty + '</span>'
      + ' <span style="float:right;font-weight:500;">&#8369;' + (checkedItems[index].price * checkedItems[index].qty) + '</span>'
      + '</li>';
  }

  let customer      = getLoggedInCustomer();
  let transactionId = getTransactionIdCounter();

  $("#pcm-icon").html(iconHtml);
  $("#pcm-payment-label").text(PAYMENT_LABELS[paymentMethod] || paymentMethod);
  $("#pcm-txn-id").text("TXN-" + transactionId);
  $("#pcm-recipient").text(customer.getName());
  $("#pcm-address").text(customer.getDeliveryAddress());
  $("#pcm-contact").text(customer.getContactNumber());
  $("#pcm-delivery").text(DELIVERY_LABELS[deliveryOption]);
  $("#pcm-items-list").html(itemLines);
  $("#pcm-subtotal").text(subtotal);
  $("#pcm-shipping").text(shippingCost);
  $("#pcm-total").text(total);

  // Store the pending transaction data on the confirm button so confirmPayment() can read it
  $("#confirmPaymentBtn")
    .data("items", JSON.stringify(checkedItems))
    .data("subtotal", subtotal)
    .data("shipping", shippingCost)
    .data("total", total)
    .data("payment-method", paymentMethod)
    .data("delivery-method", deliveryOption);

  $("#payment-confirm-modal-backdrop").css("display", "block").hide().fadeIn(300);
  $("#payment-confirm-modal").css("display", "block").hide().fadeIn(300);
}

function closePaymentConfirmModal() {
  $("#payment-confirm-modal-backdrop").fadeOut(200);
  $("#payment-confirm-modal").fadeOut(200);
}

function confirmPayment() {
  let confirmButton  = $("#confirmPaymentBtn");
  let items          = JSON.parse(confirmButton.data("items"));
  let subtotal       = confirmButton.data("subtotal");
  let shippingCost   = confirmButton.data("shipping");
  let total          = confirmButton.data("total");
  let paymentMethod  = confirmButton.data("payment-method");
  let deliveryMethod = confirmButton.data("delivery-method");
  let customer       = getLoggedInCustomer();
  let transactionId  = getTransactionIdCounter();

  // Build the transaction record
  let newTransaction = {
    transactionId:     transactionId,
    customerUsername:  customer.getUsername(),
    customerName:      customer.getName(),
    items:             items,
    subtotal:          subtotal,
    shipping:          shippingCost,
    total:             total,
    paymentMethod:     paymentMethod,
    deliveryMethod:    deliveryMethod,
    status:            "Pending"
  };

  let transactionDatabase = getTransactionDatabase();
  transactionDatabase.push(newTransaction);
  saveTransactionDatabase(transactionDatabase);
  saveTransactionIdCounter(transactionId + 1);

  // Deduct purchased quantities from the product database
  let productDatabase = getProductDatabase();
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    for (let productIndex = 0; productIndex < productDatabase.length; productIndex++) {
      if (productDatabase[productIndex].getProductId() === items[itemIndex].productId) {
        let newQuantity = Number(productDatabase[productIndex].getQuantityInStock()) - items[itemIndex].qty;
        productDatabase[productIndex].setQuantityInStock(newQuantity < 0 ? 0 : newQuantity);
        break;
      }
    }
  }
  saveProductDatabase(productDatabase);

  // Remove the purchased items from the customer's cart
  let cartArray     = getCartArray();
  let purchasedIds  = items.map(function (item) { return item.productId; });
  let remainingCart = [];
  for (let index = 0; index < cartArray.length; index++) {
    if (purchasedIds.indexOf(cartArray[index].productId) === -1) {
      remainingCart.push(cartArray[index]);
    }
  }
  saveCartArray(remainingCart);

  // Re-enable the Add to Cart button for any purchased item that still has stock
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    for (let productIndex = 0; productIndex < productDatabase.length; productIndex++) {
      if (productDatabase[productIndex].getProductId() === items[itemIndex].productId
          && productDatabase[productIndex].getQuantityInStock() > 0) {
        $(".add-to-cart[data-id='" + productIndex + "']")
          .attr("disabled", false).text("+ Cart")
          .removeClass("btn-secondary").addClass("btn-accent");
        break;
      }
    }
  }

  closePaymentConfirmModal();
  displayCartItems();
  renderOrderTables();
  showView("customer-orders-view");
}

function proceedToCheckout() {
  let checkedItems = getCheckedCartItems();
  if (checkedItems.length === 0) {
    showAlert("warning", "No Items Selected", "Please select at least one item to proceed to checkout.");
    return false;
  }
  updateCheckoutSummary();
  openCheckoutModal();
  return false;
}


/* =====================
   ORDER HISTORY HELPERS
   ===================== */

const ONGOING_STATUSES   = ["Pending", "Processing", "Shipped", "Delivered", "Processing Return", "Issuing Refund"];
const COMPLETED_STATUSES = ["Completed", "Cancelled", "Denied Return", "Returned", "Refunded"];

function generateItemsCollapsible(items, transactionId) {
  let listHtml = '<ul style="margin:6px 0 0 12px;padding:0;">';
  for (let index = 0; index < items.length; index++) {
    listHtml += '<li style="font-size:.82rem;color:var(--ink-soft);padding:2px 0;">'
      + items[index].productName + ' &times;' + items[index].qty
      + ' <span style="color:#aaa;">(&#8369;' + (items[index].price * items[index].qty) + ')</span>'
      + '</li>';
  }
  listHtml += '</ul>';

  return '<div>'
    + '<button type="button" class="btn btn-outline btn-sm toggle-items-btn" data-target="items-list-' + transactionId + '" style="font-size:.75rem;padding:4px 10px;">'
    + items.length + ' item' + (items.length > 1 ? 's' : '') + ' ▾</button>'
    + '<div id="items-list-' + transactionId + '" style="display:none;">' + listHtml + '</div>'
    + '</div>';
}

function getStatusBadgeClass(status) {
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

function renderOrderTables() {
  let customer = getLoggedInCustomer();
  if (!customer) return;

  let allTransactions = getTransactionDatabase();
  let ongoingOrders   = [];
  let completedOrders = [];

  for (let index = 0; index < allTransactions.length; index++) {
    let transaction = allTransactions[index];
    if (transaction.customerUsername !== customer.getUsername()) continue;

    if (ONGOING_STATUSES.indexOf(transaction.status) !== -1) {
      ongoingOrders.push(transaction);
    } else if (COMPLETED_STATUSES.indexOf(transaction.status) !== -1) {
      completedOrders.push(transaction);
    }
  }

  // Ongoing orders table
  let ongoingHtml = "";
  if (ongoingOrders.length === 0) {
    ongoingHtml = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">No ongoing orders.</td></tr>';
  } else {
    for (let index = 0; index < ongoingOrders.length; index++) {
      let transaction = ongoingOrders[index];
      let actionButtons = "";

      if (transaction.status === "Pending") {
        actionButtons = '<button type="button" class="btn btn-outline btn-sm cancel-order-btn" data-txn-id="' + transaction.transactionId + '" style="font-size:.75rem;">Cancel</button>';
      } else if (transaction.status === "Delivered") {
        actionButtons = '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
          + '<button type="button" class="btn btn-outline btn-sm return-order-btn" data-txn-id="' + transaction.transactionId + '" style="font-size:.75rem;">Return/Refund</button>'
          + '<button type="button" class="btn btn-accent btn-sm complete-order-btn" data-txn-id="' + transaction.transactionId + '" style="font-size:.75rem;">Complete</button>'
          + '</div>';
      }

      ongoingHtml += '<tr>'
        + '<td><span class="order-id">TXN-' + transaction.transactionId + '</span></td>'
        + '<td>' + generateItemsCollapsible(transaction.items, "ongoing-" + transaction.transactionId) + '</td>'
        + '<td style="font-weight:600;color:var(--ink);">&#8369;' + transaction.total + '</td>'
        + '<td>' + (PAYMENT_LABELS[transaction.paymentMethod] || transaction.paymentMethod) + '</td>'
        + '<td><span class="status-badge ' + getStatusBadgeClass(transaction.status) + '">● ' + transaction.status + '</span></td>'
        + '<td>' + actionButtons + '</td>'
        + '</tr>';
    }
  }
  $("#ongoing-orders-tbody").html(ongoingHtml);

  // Completed orders table
  let completedHtml = "";
  if (completedOrders.length === 0) {
    completedHtml = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">No completed orders yet.</td></tr>';
  } else {
    for (let index = 0; index < completedOrders.length; index++) {
      let transaction = completedOrders[index];
      completedHtml += '<tr>'
        + '<td><span class="order-id">TXN-' + transaction.transactionId + '</span></td>'
        + '<td>' + generateItemsCollapsible(transaction.items, "completed-" + transaction.transactionId) + '</td>'
        + '<td style="font-weight:600;color:var(--ink);">₱' + transaction.total + '</td>'
        + '<td>' + (PAYMENT_LABELS[transaction.paymentMethod] || transaction.paymentMethod) + '</td>'
        + '<td><span class="status-badge ' + getStatusBadgeClass(transaction.status) + '">● ' + transaction.status + '</span></td>'
        + '</tr>';
    }
  }
  $("#completed-orders-tbody").html(completedHtml);
}


/* =====================
   PROFILE HELPERS
   ===================== */

// Toggles between the profile display view and the edit form
function editProfileMode(element) {
  if (element.value === "Edit Profile") {
    let customer = getLoggedInCustomer();
    $("#edit-fullname").val(customer.getName());
    $("#edit-email").val(customer.getEmail());
    $("#edit-contact").val(customer.getContactNumber());
    $("#edit-address").val(customer.getDeliveryAddress());
    $("#edit-current-password").val("");
    $("#cp-current").val("");
    $("#cp-new").val("");
    $("#cp-confirm").val("");
    $("#customer-profile-edit-mode .validation-msg").text("");
    $("#customer-display-account-details").addClass("hidden");
    $("#customer-profile-edit-mode").removeClass("hidden").hide().slideDown(400);
    element.value = "View Profile";
    element.innerHTML = '<i class="fa-solid fa-eye"></i> View Profile';
  } else {
    $("#customer-profile-edit-mode").addClass("hidden");
    $("#customer-display-account-details").removeClass("hidden").hide().slideDown(400);
    element.value = "Edit Profile";
    element.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Profile';
  }
}

function checkUpdateAccountFields(fullName, email, contactNumber, deliveryAddress, password) {
  let isValid = true;

  if (!fullName || fullName.length < 3) {
    $("#edit-fullname-error").text("Full name is required and must be at least 3 characters.");
    isValid = false;
  } else { $("#edit-fullname-error").text(""); }

  let atIndex  = email.indexOf("@");
  let dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex ||
      email.includes(" ") || !email.endsWith(".com")) {
    $("#edit-email-error").text("Email is required and must be valid.");
    isValid = false;
  } else { $("#edit-email-error").text(""); }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $("#edit-contact-error").text("Contact number is required, must be at least 8 digits, and valid.");
    isValid = false;
  } else { $("#edit-contact-error").text(""); }

  if (!deliveryAddress || deliveryAddress.length < 10) {
    $("#edit-address-error").text("Delivery address is required and must be at least 10 characters.");
    isValid = false;
  } else { $("#edit-address-error").text(""); }

  if (!password || password !== getLoggedInCustomer().getPassword()) {
    $("#edit-current-password-error").text("Password is required to save changes and must match current password.");
    isValid = false;
  } else { $("#edit-current-password-error").text(""); }

  return isValid;
}

function displayUserProfile() {
  let customer = getLoggedInCustomer();
  $(".customer-name").text(customer.getName());
  $("#customer-username").text("@" + customer.getUsername());
  $("#customer-email").text(customer.getEmail());
  $("#customer-contact-number").text(customer.getContactNumber());
  $("#customer-delivery-address").text(customer.getDeliveryAddress());
  $("#checkout-recipient-name").val(customer.getName());
  $("#checkout-delivery-address").val(customer.getDeliveryAddress());
  $("#checkout-contact").val(customer.getContactNumber());
}


/* =====================
   PRODUCT SEARCH & FILTER
   ===================== */

let searchResults = [];
let searched = false;

function searchProductsByQuery(query) {
  let products = getProductDatabase();
  if (!query || products.length === 0) return;

  let addedProductIds = getCartArray().map(function (item) { return item.productId; });
  searchResults = [];
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let name        = product.getProductName().toLowerCase();
    let description = product.getDescription().toLowerCase();

    if ((name.includes(query) || description.includes(query)) && product.getQuantityInStock() > 0) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
      if (addedProductIds.indexOf(product.getProductId()) !== -1) {
        $("#search-results-grid .add-to-cart[data-id='" + index + "']")
          .attr("disabled", true).text("Added")
          .removeClass("btn-accent").addClass("btn-secondary");
      }
      searchResults.push(product);
    }
  });

  searched = true;
}

function filterProductsByCategory(filter) {
  // If a search is active, filter within those results; otherwise filter all products
  let products        = searched ? searchResults : getProductDatabase();
  let addedProductIds = getCartArray().map(function (item) { return item.productId; });

  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    if (product.getCategory().includes(filter) && product.getQuantityInStock() > 0) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
      if (addedProductIds.indexOf(product.getProductId()) !== -1) {
        $("#search-results-grid .add-to-cart[data-id='" + index + "']")
          .attr("disabled", true).text("Added")
          .removeClass("btn-accent").addClass("btn-secondary");
      }
    }
  });
}


/* =====================
   LOGOUT
   ===================== */

$(document).ready(function () {

  $("#logoutBtn, #logoutBtnSidebar, #logoutBtnProfile").click(function () {
    showConfirm("warning", "Log Out", "Are you sure you want to log out?", function () {
      searchResults = [];
      searched = false;
      saveLoggedInCustomer(null);
      location.replace("../html/auth.html");
    });
  });

});


/* =====================
   PRODUCT SEARCH & FILTER
   ===================== */

$(document).ready(function () {

  $("#search-btn").click(function () {
    let query = $("#product-search-input").val().trim().toLowerCase();
    if (!query) {
      $("#search-result-message").html("");
      searchResults = [];
      searched = false;
      $("#search-results-grid").addClass("hidden");
      $("#customer-product-grid").removeClass("hidden").hide().fadeIn(400);
      return;
    }

    searchProductsByQuery(query);
    $("#category-filter-dropdown").val("");
    $("#customer-product-grid").addClass("hidden");
    $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
    $("#search-result-message").html("Showing results for : " + query);
  });

  $("#reset-icon").click(function () {
    $("#product-search-input").val("");
    $("#category-filter-dropdown").val("");
    $("#search-result-message").html("");
    searchResults = [];
    searched = false;
    $("#search-results-grid").empty();
    $("#search-results-grid").addClass("hidden");
    $("#customer-product-grid").removeClass("hidden").hide().fadeIn(400);
  });

  $("#category-filter-dropdown").on("change", function () {
    let category = $(this).val();

    if (!searched && !category) {
      $("#search-results-grid").addClass("hidden").empty();
      $("#customer-product-grid").removeClass("hidden").hide().fadeIn(400);
      return;
    }

    filterProductsByCategory(category);
    if (!searched) {
      $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
      $("#customer-product-grid").addClass("hidden");
    } else {
      $("#search-results-grid").removeClass("hidden").hide().fadeIn(400);
    }
  });

});


/* =====================
   CART ACTIONS
   ===================== */

$(document).ready(function () {

  // Add product to cart
  $(document).on("click", ".add-to-cart", function () {
    let index   = $(this).data("id");
    let product = getProductDatabase()[index];

    // Disable the button in both grids (main and search results)
    $(".add-to-cart[data-id='" + index + "']")
      .attr("disabled", true).text("Added")
      .removeClass("btn-accent").addClass("btn-secondary");

    addToCart(product);
  });

  // Increase or decrease quantity of a cart item
  $(document).on("click", ".qty-btn", function () {
    let action    = $(this).data("action");
    let itemIndex = $(this).data("item-index");

    let cartItemElement = $("#cart-item-" + itemIndex);
    let stock    = parseInt(cartItemElement.data("stock"));
    let price    = parseFloat(cartItemElement.data("price")) || 0;
    let qtyElement = $("#qty-value-" + itemIndex);
    let quantity = parseInt(qtyElement.text());

    if (action === "increase" && quantity < stock) {
      quantity++;
    } else if (action === "decrease" && quantity > 1) {
      quantity--;
    }

    qtyElement.text(quantity);
    $("#line-total-" + itemIndex).text(price * quantity);

    cartItemElement.find('.qty-btn[data-action="decrease"]').prop("disabled", quantity <= 1);
    cartItemElement.find('.qty-btn[data-action="increase"]').prop("disabled", quantity >= stock);

    let cartArray = getCartArray();
    if (cartArray[itemIndex]) {
      cartArray[itemIndex].qty = quantity;
      saveCartArray(cartArray);
    }

    recalculateTotal();
  });

  // Update the total when a cart checkbox is toggled
  $(document).on("change", ".cart-item-checkbox", function () {
    recalculateTotal();
  });

  // Remove a single item from the cart
  $(document).on("click", ".cart-item-remove-btn", function () {
    let removeIndex       = parseInt($(this).data("index"));
    let cartArray         = getCartArray();
    let removedProductId  = cartArray[removeIndex].productId;

    cartArray.splice(removeIndex, 1);
    saveCartArray(cartArray);
    displayCartItems();

    // Re-enable the Add to Cart button on the product grid
    $.each(getProductDatabase(), function (index, product) {
      if (product.getProductId() === removedProductId) {
        $(".add-to-cart[data-id='" + index + "']")
          .attr("disabled", false).text("+ Cart")
          .removeClass("btn-secondary").addClass("btn-accent");
        return false; // stop loop
      }
    });
  });

  // Clear all items from the cart
  $(document).on("click", ".cart-clear-all-btn", function () {
    let cartArray = getCartArray();
    showConfirm("danger", "Clear Cart", "Remove all items from your cart? This cannot be undone.", function () {
      // Re-enable the Add to Cart buttons for all removed items
      $.each(cartArray, function (cartIndex, cartItem) {
        $.each(getProductDatabase(), function (productIndex, product) {
          if (product.getProductId() === cartItem.productId) {
            $(".add-to-cart[data-id='" + productIndex + "']")
              .attr("disabled", false).text("+ Cart")
              .removeClass("btn-secondary").addClass("btn-accent");
            return false; // stop inner loop
          }
        });
      });
      saveCartArray([]);
      displayCartItems();
    });
  });

});


/* =====================
   CHECKOUT FLOW
   ===================== */

$(document).ready(function () {

  // Close the checkout modal
  $("#closeCheckoutModal, #checkout-modal-backdrop").on("click", function () {
    closeCheckoutModal();
  });

  $("#backToCartBtn").on("click", function () {
    closeCheckoutModal();
  });

  // Validate payment method then open the payment confirmation modal
  $("#confirmPurchaseBtn").on("click", function () {
    let paymentMethod = $("#checkout-payment-method").val();
    if (!paymentMethod) {
      $("#checkout-payment-method-error").text("Please select a payment method.");
      return;
    }
    $("#checkout-payment-method-error").text("");
    closeCheckoutModal();
    openPaymentConfirmModal();
  });

  // Update the shipping cost when delivery option changes
  $("#checkout-delivery-option").on("change", function () {
    updateCheckoutSummary();
  });

  // Close the payment confirmation modal
  $("#closePaymentConfirmModal, #payment-confirm-modal-backdrop, #cancelPaymentBtn").on("click", function () {
    closePaymentConfirmModal();
  });

  // Place the order
  $("#confirmPaymentBtn").on("click", function () {
    confirmPayment();
  });

});


/* =====================
   ORDER ACTIONS
   ===================== */

$(document).ready(function () {

  // Toggle the item list inside an order row
  $(document).on("click", ".toggle-items-btn", function () {
    let targetId      = $(this).data("target");
    let targetElement = $("#" + targetId);

    if (targetElement.is(":visible")) {
      targetElement.slideUp(200);
      $(this).text($(this).text().replace("▴", "▾"));
    } else {
      targetElement.slideDown(200);
      $(this).text($(this).text().replace("▾", "▴"));
    }
  });

  // Cancel a pending order
  $(document).on("click", ".cancel-order-btn", function () {
    let transactionId = Number($(this).data("txn-id"));
    showConfirm("warning", "Cancel Order", "Are you sure you want to cancel this order? This cannot be undone.", function () {
      let transactionDatabase = getTransactionDatabase();
      for (let index = 0; index < transactionDatabase.length; index++) {
        if (transactionDatabase[index].transactionId === transactionId) {
          transactionDatabase[index].status = "Cancelled";

          // Restore the stock for all items in this order
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
          break;
        }
      }
      saveTransactionDatabase(transactionDatabase);
      renderOrderTables();
    });
  });

  // Mark a delivered order as completed
  $(document).on("click", ".complete-order-btn", function () {
    let transactionId       = Number($(this).data("txn-id"));
    let transactionDatabase = getTransactionDatabase();
    for (let index = 0; index < transactionDatabase.length; index++) {
      if (transactionDatabase[index].transactionId === transactionId) {
        transactionDatabase[index].status = "Completed";
        break;
      }
    }
    saveTransactionDatabase(transactionDatabase);
    renderOrderTables();
  });

  // Request a return or refund on a delivered order
  $(document).on("click", ".return-order-btn", function () {
    let transactionId = Number($(this).data("txn-id"));
    showConfirm("warning", "Request Return / Refund", "Are you sure you want to request a return or refund for this order?", function () {
      let transactionDatabase = getTransactionDatabase();
      for (let index = 0; index < transactionDatabase.length; index++) {
        if (transactionDatabase[index].transactionId === transactionId) {
          transactionDatabase[index].status = "Processing Return";
          break;
        }
      }
      saveTransactionDatabase(transactionDatabase);
      renderOrderTables();
    });
  });

});


/* =====================
   PROFILE ACTIONS
   ===================== */

$(document).ready(function () {

  $(".password-toggle-btn").on("click", function () {
    showHidePassword($(this).prev(), $(this));
  });

  // Save changes to profile info
  $("#save-profile-btn").click(function () {
    let name     = $("#edit-fullname").val().trim();
    let email    = $("#edit-email").val().trim();
    let contact  = $("#edit-contact").val().trim();
    let address  = $("#edit-address").val().trim();
    let password = $("#edit-current-password").val();

    let customer = getLoggedInCustomer();

    // Skip saving if nothing actually changed
    if (name === customer.getName() && email === customer.getEmail()
        && contact === customer.getContactNumber() && address === customer.getDeliveryAddress()) {
      return;
    }

    if (checkUpdateAccountFields(name, email, contact, address, password)) {
      let customerDatabase = getCustomerDatabase();
      $(customerDatabase).each(function (index, account) {
        if (account.getUsername() === customer.getUsername()) {
          let targetCustomer = customerDatabase[index];
          targetCustomer.setName(name);
          targetCustomer.setEmail(email);
          targetCustomer.setContactNumber(contact);
          targetCustomer.setDeliveryAddress(address);
          customerDatabase[index] = targetCustomer;
          saveCustomerDatabase(customerDatabase);
          saveLoggedInCustomer(targetCustomer);
          displayUserProfile();
          showAlert("success", "Profile Updated", "Your profile has been updated successfully.");
          $("#customer-edit-profile-btn").click();
          return false; // stop loop
        }
      });
    }
  });

  // Change password
  $("#change-password-btn").click(function () {
    let customer        = getLoggedInCustomer();
    let currentPassword = $("#cp-current").val();
    let newPassword     = $("#cp-new").val();
    let confirmPassword = $("#cp-confirm").val();
    let isValid         = true;

    if (currentPassword !== customer.getPassword()) {
      $("#cp-current-error").text("Password is required to save changes and must match current password.");
      isValid = false;
    } else { $("#cp-current-error").text(""); }

    if (!newPassword || newPassword.length < 8) {
      $("#cp-new-error").text("Password is required and must be at least 8 characters.");
      isValid = false;
    } else { $("#cp-new-error").text(""); }

    if (newPassword !== confirmPassword) {
      $("#cp-confirm-error").text("Passwords do not match.");
      isValid = false;
    } else { $("#cp-confirm-error").text(""); }

    if (isValid) {
      let customerDatabase = getCustomerDatabase();
      $(customerDatabase).each(function (index, account) {
        if (account.getUsername() === customer.getUsername()) {
          let targetCustomer = customerDatabase[index];
          targetCustomer.setPassword(newPassword);
          customerDatabase[index] = targetCustomer;
          saveCustomerDatabase(customerDatabase);
          saveLoggedInCustomer(targetCustomer);
          showAlert("success", "Password Changed", "Your password has been updated successfully.");
          $("#customer-edit-profile-btn").click();
          return false; // stop loop
        }
      });
    }
  });

  // Deactivate (delete) account
  $("#deactivate-account-btn").click(function () {
    let customer        = getLoggedInCustomer();
    let currentPassword = $("#cp-current").val();

    if (!currentPassword || currentPassword !== customer.getPassword()) {
      $("#cp-current-error").text("Enter your current password above to deactivate your account.");
      return;
    }
    $("#cp-current-error").text("");

    showConfirm("danger", "Deactivate Account", "This will permanently delete your account. This cannot be undone.", function () {
      let customerDatabase = getCustomerDatabase();
      let remainingCustomers = [];
      for (let index = 0; index < customerDatabase.length; index++) {
        if (customerDatabase[index].getUsername() !== customer.getUsername()) {
          remainingCustomers.push(customerDatabase[index]);
        }
      }
      saveCustomerDatabase(remainingCustomers);
      saveLoggedInCustomer(null);
      location.replace("../html/auth.html");
    });
  });

});


/* =====================
   INITIALIZATION
   ===================== */

$(document).ready(function () {

  if (getLoggedInCustomer()) {
    displayUserProfile();
    renderCustomerProductCards();
    displayCartItems();
    renderOrderTables();
  } else {
    location.replace("../html/auth.html");
  }

});
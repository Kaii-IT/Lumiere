/* customer.js - Customer page script. Depends on: shared.js */

/* Sub-view navigation within customer.html */
function showView(viewId) {
  $(".sub-section").addClass("hidden");
  $("#" + viewId).removeClass("hidden").hide().fadeIn(400);
  $(".nav-link, .sidebar-nav a").removeClass("active");
  $("a[onclick*=\"'" + viewId + "'\"]").addClass("active");
  window.scrollTo(0, 0);
  return false;
}

function generateCustomerProductCard(product, index) {
  if (!product) return "";

  let id = product.getProductId();
  let category = product.getCategory();
  let name = product.getProductName();
  let description = product.getDescription();
  let quantity = product.getQuantityInStock();
  let price = product.getPrice();
  let imageUrl = product.getImageUrl();

  let parts = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0];
  let label = parts[1];

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

  // collect product ids already in the cart so we can mark their buttons on load
  let addedIds = [];
  $.each(cartArray, function (i, cartItem) {
    addedIds.push(cartItem.productId);
  });

  $.each(getProductDatabase(), function (index, product) {
    if (product.getQuantityInStock() > 0) {
      $("#customer-product-grid").append(generateCustomerProductCard(product, index));

      // if this product is already in the cart, disable its button right away
      if (addedIds.indexOf(product.getProductId()) !== -1) {
        $("#customer-product-grid .add-to-cart[data-id='" + index + "']")
          .attr("disabled", true).text("Added")
          .removeClass("btn-accent").addClass("btn-secondary");
      }
    }
  });
}

/* ---- Cart helpers ----
   Account.getCart() rebuilds Product objects and drops any extra fields like qty.
   So we read the raw cart array straight from localStorage and save it back
   using setCart() + saveLoggedInCustomer() + customerDB sync - same pattern as shared.js.
*/

function getCartArray() {
  let customer = getLoggedInCustomer();
  if (!customer) return [];
  return customer.getRawCart() || [];
}

function saveCartArray(cartArray) {
  let customer = getLoggedInCustomer();
  customer.setCart(cartArray);
  saveLoggedInCustomer(customer);

  let customerDB = getCustomerDatabase();
  for (let i = 0; i < customerDB.length; i++) {
    if (customerDB[i].getUsername() === customer.getUsername()) {
      customerDB[i].setCart(cartArray);
      saveCustomerDatabase(customerDB);
      break;
    }
  }
}

function addToCart(product) {
  let cartArray = getCartArray();

  let cartItem = {
    productId: product.getProductId(),
    category: product.getCategory(),
    productName: product.getProductName(),
    description: product.getDescription(),
    quantityInStock: product.getQuantityInStock(),
    price: product.getPrice(),
    imageUrl: product.getImageUrl(),
    qty: 1
  };

  cartArray.push(cartItem);
  saveCartArray(cartArray);

  // remove the "cart is empty" message if it's showing
  $("#cart-items p").remove();

  // append just the new item so the cart view updates live without full re-render
  let newIndex = cartArray.length - 1;
  $("#cart-items").append(generateCartItemCard(cartItem, newIndex));
}

/* ---- Cart rendering ---- */

function generateCartItemCard(cartItem, cartIndex) {
  let qty = cartItem.qty || 1;
  let stock = cartItem.quantityInStock || 0;
  let price = cartItem.price;
  let name = cartItem.productName;
  let description = cartItem.description;
  let imageUrl = cartItem.imageUrl;
  let category = cartItem.category;
  let lineTotal = price * qty;

  let parts = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0];
  let label = parts[1];

  let decreaseDisabled = qty <= 1 ? "disabled" : "";
  let increaseDisabled = qty >= stock ? "disabled" : "";

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
        <div class="qty-value" id="qty-value-${cartIndex}">${qty}</div>
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

function recalculateTotal() {
  let total = 0;

  $("#cart-items .cart-item").each(function () {
    if (!$(this).find(".cart-item-checkbox").prop("checked")) return;

    let itemIndex = $(this).attr("id").replace("cart-item-", "");
    let price = parseFloat($(this).data("price")) || 0;
    let qty = parseInt($("#qty-value-" + itemIndex).text()) || 1;
    total += price * qty;
  });

  $(".cart-selected-amount").html("&#8369;" + total);
}

/* ---- Checkout helpers ---- */

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
      let item = cartArray[itemIndex];
      let qty = parseInt($("#qty-value-" + itemIndex).text()) || 1;
      checkedItems.push({
        productId:    item.productId,
        productName:  item.productName,
        price:        item.price,
        qty:          qty,
        category:     item.category,
        imageUrl:     item.imageUrl
      });
    }
  });
  return checkedItems;
}

function updateCheckoutSummary() {
  let checkedItems = getCheckedCartItems();
  let subtotal = 0;
  for (let i = 0; i < checkedItems.length; i++) {
    subtotal += parseFloat(checkedItems[i].price) * checkedItems[i].qty;
  }

  let deliveryOption = $("#checkout-delivery-option").val() || "standard";
  let shipping = SHIPPING_COSTS[deliveryOption] || 150;

  let itemsHtml = "";
  if (checkedItems.length === 0) {
    itemsHtml = '<p style="font-size:.85rem;color:#888;margin-bottom:8px;">No items selected.</p>';
  } else {
    for (let i = 0; i < checkedItems.length; i++) {
      let item = checkedItems[i];
      itemsHtml += '<div class="cart-summary-row" style="font-size:.85rem;">'
        + '<span>' + item.productName + ' &times;' + item.qty + '</span>'
        + '<span>&#8369;' + (parseFloat(item.price) * item.qty) + '</span>'
        + '</div>';
    }
  }
  $("#checkout-items-list").html(itemsHtml);
  $("#checkout-subtotal").text(subtotal);
  $("#checkout-shipping").text(shipping);
  $("#checkout-total").text(subtotal + shipping);
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
  let checkedItems  = getCheckedCartItems();
  let deliveryOption = $("#checkout-delivery-option").val() || "standard";
  let paymentMethod  = $("#checkout-payment-method").val();
  let subtotal = 0;
  for (let i = 0; i < checkedItems.length; i++) {
    subtotal += parseFloat(checkedItems[i].price) * checkedItems[i].qty;
  }
  let shipping = SHIPPING_COSTS[deliveryOption] || 150;
  let total    = subtotal + shipping;

  let iconHtml = PAYMENT_ICONS[paymentMethod] || '<i class="fa-solid fa-wallet" style="font-size:2.2rem;"></i>';

  let itemLines = "";
  for (let i = 0; i < checkedItems.length; i++) {
    itemLines += '<li style="font-size:.85rem;color:var(--ink-soft);padding:3px 0;">'
      + checkedItems[i].productName + ' <span style="color:#aaa;">&times;' + checkedItems[i].qty + '</span>'
      + ' <span style="float:right;font-weight:500;">&#8369;' + (checkedItems[i].price * checkedItems[i].qty) + '</span>'
      + '</li>';
  }

  let customer = getLoggedInCustomer();
  let txnId    = getTransactionIdCounter();

  $("#pcm-icon").html(iconHtml);
  $("#pcm-payment-label").text(PAYMENT_LABELS[paymentMethod] || paymentMethod);
  $("#pcm-txn-id").text("TXN-" + txnId);
  $("#pcm-recipient").text(customer.getName());
  $("#pcm-address").text(customer.getDeliveryAddress());
  $("#pcm-contact").text(customer.getContactNumber());
  $("#pcm-delivery").text(DELIVERY_LABELS[deliveryOption]);
  $("#pcm-items-list").html(itemLines);
  $("#pcm-subtotal").text(subtotal);
  $("#pcm-shipping").text(shipping);
  $("#pcm-total").text(total);

  // store pending txn data in modal for confirmPayment to read
  $("#confirmPaymentBtn")
    .data("items",          JSON.stringify(checkedItems))
    .data("subtotal",       subtotal)
    .data("shipping",       shipping)
    .data("total",          total)
    .data("payment-method", paymentMethod)
    .data("delivery-method",deliveryOption);

  $("#payment-confirm-modal-backdrop").css("display", "block").hide().fadeIn(300);
  $("#payment-confirm-modal").css("display", "block").hide().fadeIn(300);
}
function closePaymentConfirmModal() {
  $("#payment-confirm-modal-backdrop").fadeOut(200);
  $("#payment-confirm-modal").fadeOut(200);
}

function confirmPayment() {
  let btn           = $("#confirmPaymentBtn");
  let items         = JSON.parse(btn.data("items"));
  let subtotal      = btn.data("subtotal");
  let shipping      = btn.data("shipping");
  let total         = btn.data("total");
  let paymentMethod = btn.data("payment-method");
  let deliveryMethod= btn.data("delivery-method");
  let customer      = getLoggedInCustomer();
  let txnId         = getTransactionIdCounter();

  // build raw transaction object
  let txn = {
    transactionId:    txnId,
    customerUsername: customer.getUsername(),
    customerName:     customer.getName(),
    items:            items,
    subtotal:         subtotal,
    shipping:         shipping,
    total:            total,
    paymentMethod:    paymentMethod,
    deliveryMethod:   deliveryMethod,
    status:           "Pending"
  };

  // save to global transaction database
  let txnDB = getTransactionDatabase();
  txnDB.push(txn);
  saveTransactionDatabase(txnDB);
  saveTransactionIdCounter(txnId + 1);

  // deduct stock from productDatabase
  let productDB = getProductDatabase();
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < productDB.length; j++) {
      if (productDB[j].getProductId() === items[i].productId) {
        let newQty = Number(productDB[j].getQuantityInStock()) - items[i].qty;
        productDB[j].setQuantityInStock(newQty < 0 ? 0 : newQty);
        break;
      }
    }
  }
  saveProductDatabase(productDB);

  // remove purchased items from cart
  let cartArray = getCartArray();
  let purchasedIds = items.map(function (item) { return item.productId; });
  let newCart = [];
  for (let i = 0; i < cartArray.length; i++) {
    if (purchasedIds.indexOf(cartArray[i].productId) === -1) newCart.push(cartArray[i]);
  }
  saveCartArray(newCart);

  // re-enable add-to-cart buttons for purchased items that are still in stock
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < productDB.length; j++) {
      if (productDB[j].getProductId() === items[i].productId && productDB[j].getQuantityInStock() > 0) {
        $(".add-to-cart[data-id='" + j + "']")
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

/* ---- Orders rendering ---- */

const ONGOING_STATUSES   = ["Pending", "Processing", "Shipped", "Delivered", "Processing Return", "Issuing Refund"];
const COMPLETED_STATUSES = ["Completed", "Cancelled", "Denied Return", "Returned", "Refunded"];
const CANCELLED_STATUSES = [];

function generateItemsCollapsible(items, txnId) {
  let listHtml = '<ul style="margin:6px 0 0 12px;padding:0;">';
  for (let i = 0; i < items.length; i++) {
    listHtml += '<li style="font-size:.82rem;color:var(--ink-soft);padding:2px 0;">'
      + items[i].productName + ' &times;' + items[i].qty
      + ' <span style="color:#aaa;">(&#8369;' + (items[i].price * items[i].qty) + ')</span>'
      + '</li>';
  }
  listHtml += '</ul>';

  return '<div>'
    + '<button type="button" class="btn btn-outline btn-sm toggle-items-btn" data-target="items-list-' + txnId + '" style="font-size:.75rem;padding:4px 10px;">'
    + items.length + ' item' + (items.length > 1 ? 's' : '') + ' ▾</button>'
    + '<div id="items-list-' + txnId + '" style="display:none;">' + listHtml + '</div>'
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

  let allTxns = getTransactionDatabase();
  let ongoing   = [];
  let completed = [];

  for (let i = 0; i < allTxns.length; i++) {
    let t = allTxns[i];
    if (t.customerUsername !== customer.getUsername()) continue;
    if (ONGOING_STATUSES.indexOf(t.status) !== -1) {
      ongoing.push(t);
    } else if (COMPLETED_STATUSES.indexOf(t.status) !== -1) {
      completed.push(t);
    }
    // cancelled/returned/refunded are dropped from both tables
  }

  // --- Ongoing table ---
  let ongoingHtml = "";
  if (ongoing.length === 0) {
    ongoingHtml = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">No ongoing orders.</td></tr>';
  } else {
    for (let i = 0; i < ongoing.length; i++) {
      let t = ongoing[i];
      let actionBtns = "";
      if (t.status === "Pending") {
        actionBtns = '<button type="button" class="btn btn-outline btn-sm cancel-order-btn" data-txn-id="' + t.transactionId + '" style="font-size:.75rem;">Cancel</button>';
      } else if (t.status === "Delivered") {
        actionBtns = '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
          + '<button type="button" class="btn btn-outline btn-sm return-order-btn" data-txn-id="' + t.transactionId + '" style="font-size:.75rem;">Return/Refund</button>'
          + '<button type="button" class="btn btn-accent btn-sm complete-order-btn" data-txn-id="' + t.transactionId + '" style="font-size:.75rem;">Complete</button>'
          + '</div>';
      }
      ongoingHtml += '<tr>'
        + '<td><span class="order-id">TXN-' + t.transactionId + '</span></td>'
        + '<td>' + generateItemsCollapsible(t.items, "ongoing-" + t.transactionId) + '</td>'
        + '<td style="font-weight:600;color:var(--ink);">&#8369;' + t.total + '</td>'
        + '<td>' + (PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod) + '</td>'
        + '<td><span class="status-badge ' + getStatusBadgeClass(t.status) + '">● ' + t.status + '</span></td>'
        + '<td>' + actionBtns + '</td>'
        + '</tr>';
    }
  }
  $("#ongoing-orders-tbody").html(ongoingHtml);

  // --- Completed table ---
  let completedHtml = "";
  if (completed.length === 0) {
    completedHtml = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">No completed orders yet.</td></tr>';
  } else {
    for (let i = 0; i < completed.length; i++) {
      let t = completed[i];
      completedHtml += '<tr>'
        + '<td><span class="order-id">TXN-' + t.transactionId + '</span></td>'
        + '<td>' + generateItemsCollapsible(t.items, "completed-" + t.transactionId) + '</td>'
        + '<td style="font-weight:600;color:var(--ink);">&#8369;' + t.total + '</td>'
        + '<td>' + (PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod) + '</td>'
        + '<td><span class="status-badge ' + getStatusBadgeClass(t.status) + '">● ' + t.status + '</span></td>'
        + '</tr>';
    }
  }
  $("#completed-orders-tbody").html(completedHtml);
}

/* Profile edit/view toggle */
function editProfileMode(element) {
  if (element.value === "Edit Profile") {
    $("#edit-fullname").val(getLoggedInCustomer().getName());
    $("#edit-email").val(getLoggedInCustomer().getEmail());
    $("#edit-contact").val(getLoggedInCustomer().getContactNumber());
    $("#edit-address").val(getLoggedInCustomer().getDeliveryAddress());

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
  let valid = true;

  if (!fullName || fullName.length < 3) {
    $("#edit-fullname-error").text("Full name is required and must be at least 3 characters.");
    valid = false;
  } else { $("#edit-fullname-error").text(""); }

  let atIndex = email.indexOf("@"), dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex ||
    email.includes(" ") || !email.endsWith(".com")) {
    $("#edit-email-error").text("Email is required and must be valid.");
    valid = false;
  } else { $("#edit-email-error").text(""); }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $("#edit-contact-error").text("Contact number is required, must be at least 8 digits, and valid.");
    valid = false;
  } else { $("#edit-contact-error").text(""); }

  if (!deliveryAddress || deliveryAddress.length < 10) {
    $("#edit-address-error").text("Delivery address is required and must be at least 10 characters.");
    valid = false;
  } else { $("#edit-address-error").text(""); }

  if (!password || password != getLoggedInCustomer().getPassword()) {
    $("#edit-current-password-error").text("Password is required to save changes and must match current password.");
    valid = false;
  } else { $("#edit-current-password-error").text(""); }

  return valid;
}

let searchResults = [];
let searched = false;

function searchProductsByQuery(query) {
  let products = getProductDatabase();

  if (!query || products.length == 0) { return; }

  let addedIds = getCartArray().map(function (item) { return item.productId; });

  searchResults = [];
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let name = product.getProductName().toLowerCase();
    let description = product.getDescription().toLowerCase();

    if ((name.includes(query) || description.includes(query)) && product.getQuantityInStock() > 0) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
      if (addedIds.indexOf(product.getProductId()) !== -1) {
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
  let products = searched ? searchResults : getProductDatabase();
  let addedIds = getCartArray().map(function (item) { return item.productId; });

  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    if (product.getCategory().includes(filter) && product.getQuantityInStock() > 0) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
      if (addedIds.indexOf(product.getProductId()) !== -1) {
        $("#search-results-grid .add-to-cart[data-id='" + index + "']")
          .attr("disabled", true).text("Added")
          .removeClass("btn-accent").addClass("btn-secondary");
      }
    }
  });
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

$(document).ready(function () {

  /* Logout - navbar, sidebar, and profile card buttons */
  $("#logoutBtn, #logoutBtnSidebar, #logoutBtnProfile").click(function () {
    showConfirm("warning", "Log Out", "Are you sure you want to log out?", function () {
      searchResults = [];
      searched = false;
      saveLoggedInCustomer(null);
      location.replace("../html/auth.html");
    });
  });

  /* Search */
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
      $("#search-results-grid").addClass("hidden");
      $("#search-results-grid").empty();
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

  /* Add to cart */
  $(document).on("click", ".add-to-cart", function () {
    let index = $(this).data("id");
    let product = getProductDatabase()[index];

    // Disable the button in whichever grid it lives in, and the other grid too
    $(".add-to-cart[data-id='" + index + "']")
      .attr("disabled", true).text("Added")
      .removeClass("btn-accent").addClass("btn-secondary");

    addToCart(product);
  });

  /* Qty buttons */
  $(document).on("click", ".qty-btn", function () {
    let action = $(this).data("action");
    let itemIndex = $(this).data("item-index");

    let cartItemEl = $("#cart-item-" + itemIndex);
    let stock = parseInt(cartItemEl.data("stock"));
    let price = parseFloat(cartItemEl.data("price")) || 0;
    let qtyEl = $("#qty-value-" + itemIndex);
    let qty = parseInt(qtyEl.text());

    if (action === "increase" && qty < stock) {
      qty++;
    } else if (action === "decrease" && qty > 1) {
      qty--;
    }

    qtyEl.text(qty);
    $("#line-total-" + itemIndex).text(price * qty);

    cartItemEl.find('.qty-btn[data-action="decrease"]').prop("disabled", qty <= 1);
    cartItemEl.find('.qty-btn[data-action="increase"]').prop("disabled", qty >= stock);

    let cartArray = getCartArray();
    if (cartArray[itemIndex]) {
      cartArray[itemIndex].qty = qty;
      saveCartArray(cartArray);
    }

    recalculateTotal();
  });

  /* Checkbox updates total */
  $(document).on("change", ".cart-item-checkbox", function () {
    recalculateTotal();
  });

  /* Remove one item */
  $(document).on("click", ".cart-item-remove-btn", function () {
    let index = parseInt($(this).data("index"));
    let cartArray = getCartArray();
    let removedProductId = cartArray[index].productId;

    cartArray.splice(index, 1);
    saveCartArray(cartArray);
    displayCartItems();

    // re-enable the add to cart button on the home page for this product
    $.each(getProductDatabase(), function (i, product) {
      if (product.getProductId() === removedProductId) {
        $(".add-to-cart[data-id='" + i + "']")
          .attr("disabled", false).text("+ Cart")
          .removeClass("btn-secondary").addClass("btn-accent");
        return false; // break
      }
    });
  });

  /* Clear all */
  $(document).on("click", ".cart-clear-all-btn", function () {
    let cartArray = getCartArray();
    showConfirm("danger", "Clear Cart", "Remove all items from your cart? This cannot be undone.", function () {
      // re-enable all matching add to cart buttons on the home page
      $.each(cartArray, function (i, cartItem) {
        $.each(getProductDatabase(), function (j, product) {
          if (product.getProductId() === cartItem.productId) {
            $(".add-to-cart[data-id='" + j + "']")
              .attr("disabled", false).text("+ Cart")
              .removeClass("btn-secondary").addClass("btn-accent");
            return false;
          }
        });
      });
      saveCartArray([]);
      displayCartItems();
    });
  });

  /* Save profile */
  $("#save-profile-btn").click(function () {
    let name = $("#edit-fullname").val().trim();
    let email = $("#edit-email").val().trim();
    let contact = $("#edit-contact").val().trim();
    let address = $("#edit-address").val().trim();
    let password = $("#edit-current-password").val();

    if (name === getLoggedInCustomer().getName() &&
      email === getLoggedInCustomer().getEmail() &&
      contact === getLoggedInCustomer().getContactNumber() &&
      address === getLoggedInCustomer().getDeliveryAddress()) {
      return;
    }

    if (checkUpdateAccountFields(name, email, contact, address, password)) {
      let customerDB = getCustomerDatabase();

      $(customerDB).each(function (index, account) {
        if (account.getUsername() === getLoggedInCustomer().getUsername()) {
          let customer = customerDB[index];
          customer.setName(name);
          customer.setEmail(email);
          customer.setContactNumber(contact);
          customer.setDeliveryAddress(address);
          customerDB[index] = customer;

          saveCustomerDatabase(customerDB);
          saveLoggedInCustomer(customer);
          displayUserProfile();
          showAlert("success", "Profile Updated", "Your profile has been updated successfully.");
          $("#customer-edit-profile-btn").click();
          return false; // break $.each
        }
      });
    }
  });

  $(".password-toggle-btn").on("click", function () {
    showHidePassword($(this).prev(), $(this));
  });

  /* Change password */
  $("#change-password-btn").click(function () {
    let customer = getLoggedInCustomer();
    let currentPass = $("#cp-current").val();
    let newPass = $("#cp-new").val();
    let confirmNewPass = $("#cp-confirm").val();

    let valid = true;

    if (currentPass !== customer.getPassword()) {
      $("#cp-current-error").text("Password is required to save changes and must match current password.");
      valid = false;
    } else { $("#cp-current-error").text(""); }

    if (!newPass || newPass.length < 8) {
      $("#cp-new-error").text("Password is required and must be at least 8 characters.");
      valid = false;
    } else { $("#cp-new-error").text(""); }

    if (newPass !== confirmNewPass) {
      $("#cp-confirm-error").text("Passwords do not match.");
      valid = false;
    } else { $("#cp-confirm-error").text(""); }

    if (valid) {
      let customerDB = getCustomerDatabase();

      $(customerDB).each(function (index, account) {
        if (account.getUsername() === customer.getUsername()) {
          let customerAccount = customerDB[index];
          customerAccount.setPassword(newPass);
          customerDB[index] = customerAccount;

          saveCustomerDatabase(customerDB);
          saveLoggedInCustomer(customerAccount);
          showAlert("success", "Password Changed", "Your password has been updated successfully.");
          $("#customer-edit-profile-btn").click();
          return false; // break $.each
        }
      });
    }
  });

  /* Checkout modal — close */
  $("#closeCheckoutModal, #checkout-modal-backdrop").on("click", function () {
    closeCheckoutModal();
  });

  /* Checkout modal — back to cart */
  $("#backToCartBtn").on("click", function () {
    closeCheckoutModal();
  });

  /* Checkout modal — confirm purchase: validate payment method then open payment confirm modal */
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

  /* Delivery option — live shipping update */
  $("#checkout-delivery-option").on("change", function () {
    updateCheckoutSummary();
  });

  /* Payment confirm modal — cancel */
  $("#closePaymentConfirmModal, #payment-confirm-modal-backdrop, #cancelPaymentBtn").on("click", function () {
    closePaymentConfirmModal();
  });

  /* Payment confirm modal — confirm */
  $("#confirmPaymentBtn").on("click", function () {
    confirmPayment();
  });

  /* Orders — toggle items collapsible */
  $(document).on("click", ".toggle-items-btn", function () {
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

  /* Orders — cancel */
  $(document).on("click", ".cancel-order-btn", function () {
    let txnId = Number($(this).data("txn-id"));
    showConfirm("warning", "Cancel Order", "Are you sure you want to cancel this order? This cannot be undone.", function () {
      let txnDB = getTransactionDatabase();
      for (let i = 0; i < txnDB.length; i++) {
        if (txnDB[i].transactionId === txnId) {
          txnDB[i].status = "Cancelled";
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
          break;
        }
      }
      saveTransactionDatabase(txnDB);
      renderOrderTables();
    });
  });

  /* Orders — complete */
  $(document).on("click", ".complete-order-btn", function () {
    let txnId = Number($(this).data("txn-id"));
    let txnDB = getTransactionDatabase();
    for (let i = 0; i < txnDB.length; i++) {
      if (txnDB[i].transactionId === txnId) {
        txnDB[i].status = "Completed";
        break;
      }
    }
    saveTransactionDatabase(txnDB);
    renderOrderTables();
  });

  /* Orders — return/refund */
  $(document).on("click", ".return-order-btn", function () {
    let txnId = Number($(this).data("txn-id"));
    showConfirm("warning", "Request Return / Refund", "Are you sure you want to request a return or refund for this order?", function () {
      let txnDB = getTransactionDatabase();
      for (let i = 0; i < txnDB.length; i++) {
        if (txnDB[i].transactionId === txnId) {
          txnDB[i].status = "Processing Return";
          break;
        }
      }
      saveTransactionDatabase(txnDB);
      renderOrderTables();
    });
  });

  /* Init */
  renderCustomerProductCards();
  displayCartItems();
  renderOrderTables();
  if (getLoggedInCustomer()) {
    displayUserProfile();
  } else {
    location.replace("../html/auth.html");
  }

});
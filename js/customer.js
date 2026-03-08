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

  let id          = product.getProductId();
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
  let raw = JSON.parse(localStorage.getItem("loggedInCustomer"));
  if (!raw) return [];
  return raw.cart || [];
}

function saveCartArray(cartArray) {
  let customer = getLoggedInCustomer();
  customer.setCart(cartArray);
  saveLoggedInCustomer(customer);

  // sync cart back to customerDatabase so it persists after logout/login
  // read the raw array directly to avoid getCustomerDatabase() crashing on null entries
  let rawDB = JSON.parse(localStorage.getItem("customerDatabase"));
  if (!rawDB) return;

  $.each(rawDB, function (i, obj) {
    if (obj && obj.username === customer.getUsername()) {
      rawDB[i].cart = cartArray;
      localStorage.setItem("customerDatabase", JSON.stringify(rawDB));
      return false; // break
    }
  });
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
    qty:             1
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
  let qty         = cartItem.qty || 1;
  let stock       = cartItem.quantityInStock || 0;
  let price       = cartItem.price;
  let name        = cartItem.productName;
  let description = cartItem.description;
  let imageUrl    = cartItem.imageUrl;
  let category    = cartItem.category;
  let lineTotal   = price * qty;

  let parts    = getImagePlaceholderByCategory(category).split(",");
  let iconHtml = parts[0];
  let label    = parts[1];

  let decreaseDisabled = qty <= 1     ? "disabled" : "";
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
    let price     = parseFloat($(this).data("price")) || 0;
    let qty       = parseInt($("#qty-value-" + itemIndex).text()) || 1;
    total += price * qty;
  });

  $(".cart-selected-amount").html("&#8369;" + total);
}

/* Profile edit/view toggle */
function editProfileMode(element) {
  if (element.innerHTML === "Edit Profile") {
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
    element.innerHTML = "View Profile";
  } else {
    $("#customer-profile-edit-mode").addClass("hidden");
    $("#customer-display-account-details").removeClass("hidden").hide().slideDown(400);
    element.innerHTML = "Edit Profile";
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

  searchResults = [];
  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let name        = product.getProductName().toLowerCase();
    let description = product.getDescription().toLowerCase();

    if (name.includes(query) || description.includes(query)) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
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
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
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
    searchResults = [];
    searched = false;
    saveLoggedInCustomer(null);
    location.replace("../html/auth.html");
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
    let index   = $(this).data("id");
    let product = getProductDatabase()[index];

    $(this).attr("disabled", true).text("Added");
    $(this).removeClass("btn-accent").addClass("btn-secondary");

    addToCart(product);
  });

  /* Qty buttons */
  $(document).on("click", ".qty-btn", function () {
    let action    = $(this).data("action");
    let itemIndex = $(this).data("item-index");

    let cartItemEl = $("#cart-item-" + itemIndex);
    let stock      = parseInt(cartItemEl.data("stock"));
    let price      = parseFloat(cartItemEl.data("price")) || 0;
    let qtyEl      = $("#qty-value-" + itemIndex);
    let qty        = parseInt(qtyEl.text());

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
    let index     = parseInt($(this).data("index"));
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
    if (!confirm("Remove all items from your cart?")) return;

    let cartArray = getCartArray();

    // re-enable all matching add to cart buttons on the home page
    $.each(cartArray, function (i, cartItem) {
      $.each(getProductDatabase(), function (j, product) {
        if (product.getProductId() === cartItem.productId) {
          $(".add-to-cart[data-id='" + j + "']")
            .attr("disabled", false).text("+ Cart")
            .removeClass("btn-secondary").addClass("btn-accent");
          return false; // break inner loop
        }
      });
    });

    saveCartArray([]);
    displayCartItems();
  });

  /* Save profile */
  $("#save-profile-btn").click(function () {
    let name     = $("#edit-fullname").val().trim();
    let email    = $("#edit-email").val().trim();
    let contact  = $("#edit-contact").val().trim();
    let address  = $("#edit-address").val().trim();
    let password = $("#edit-current-password").val();

    if (name    === getLoggedInCustomer().getName() &&
        email   === getLoggedInCustomer().getEmail() &&
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
          alert("Profile updated successfully!");
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
    let customer       = getLoggedInCustomer();
    let currentPass    = $("#cp-current").val();
    let newPass        = $("#cp-new").val();
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
          alert("Account password updated successfully!");
          $("#customer-edit-profile-btn").click();
          return false; // break $.each
        }
      });
    }
  });

  /* Init */
  renderCustomerProductCards();
  displayCartItems();
  if (getLoggedInCustomer()) {
    displayUserProfile();
  } else {
    location.replace("../html/auth.html");
  }

});
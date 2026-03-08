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
    + '<div class="product-category">' + label + '</div>'
    + '<h3 class="product-name">' + name + '</h3>'
    + '<p class="product-desc">' + description + '</p>'
    + '<p style="font-size: 0.8em">Available Stock: ' + quantity + '</p>'
    + '<div class="product-footer">'
    + '<div class="product-price">&#8369;' + price + '</div>'
    + '<button type="button" class="btn btn-accent btn-sm" data-id="' + index + '">+ Cart</button>'
    + '</div></div></article>';
}

function renderCustomerProductCards() {
  $.each(getProductDatabase(), function (index, product) {
    $("#customer-product-grid").append(generateCustomerProductCard(product, index));
  });
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
    let category = product.getCategory();

    if (name.includes(query) || description.includes(query)) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
      searchResults.push(product);
    }
  });

  searched = true;
}

function filterProductsByCategory(filter) {
  let products;
  if (searched) {
    products = searchResults;
  } else {
    products = getProductDatabase();
  }

  $("#search-results-grid").empty();

  $.each(products, function (index, product) {
    let category = product.getCategory();
    if (category.includes(filter)) {
      $("#search-results-grid").append(generateCustomerProductCard(product, index));
    }
  });
}

$(document).ready(function () {
  /* Logout - navbar, sidebar, and profile card buttons */
  $("#logoutBtn, #logoutBtnSidebar, #logoutBtnProfile").click(function () {
    searchResults = [];
    searched = false;

    saveLoggedInCustomer(null);

    location.replace("../html/auth.html");
  });

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
          alert("Profile updated successfully!");
          $("#customer-edit-profile-btn").click(); // switch back to view mode
          return false; // break $.each
        }
      });
    }
  });

  $(".password-toggle-btn").on("click", function () {
    showHidePassword($(this).prev(), $(this));
  });

  $("#change-password-btn").click(function () {
    let customer = getLoggedInCustomer();

    let currentPass = $("#cp-current").val();
    let newPass = $("#cp-new").val();
    let confirmNewPass = $("#cp-confirm").val();

    let currentPassError = $("#cp-current-error");
    let newPassError = $("#cp-new-error");
    let confirmNewPassError = $("#cp-confirm-error");

    let valid = true;

    if (currentPass !== customer.getPassword()) {
      currentPassError.text("Password is required to save changes and must match current password.");
      valid = false;
    } else {
      currentPassError.text("");
    }

    if (!newPass || newPass.length < 8) {
      newPassError.text("Password is required and must be at least 8 characters.");
      valid = false;
    } else {
      newPassError.text("");
    }

    if (newPass !== confirmNewPass) {
      confirmNewPassError.text("Passwords do not match.");
      valid = false;
    } else {
      confirmNewPassError.text("");
    }

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
          $("#customer-edit-profile-btn").click(); // switch back to view mode
          return false; // break $.each
        }
      });
    }

  });

  /* Render products */
  renderCustomerProductCards();
  if (getLoggedInCustomer()) {
    displayUserProfile();
  } else {
    location.replace("../html/auth.html");
  }


});

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
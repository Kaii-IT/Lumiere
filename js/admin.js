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

/* ---- EVENTS ---- */

$(document).ready(function () {
  /* Logout */
  $("#logoutBtn, #logoutBtnSidebar").click(function () {
    saveIsAdminLoggedIn(false);
    location.replace("../html/auth.html");
  });

  /* Add Product */
  $("#addProductBtn").click(function () {
    let category    = $("#product-category").val().trim();
    let productName = $("#product-name").val().trim();
    let description = $("#product-description").val().trim();
    let quantity    = $("#product-quantity").val().trim();
    let price       = $("#product-price").val().trim();
    let imageUrl    = $("#product-image-url").val().trim();
    let $adminProductForm = $("#add-product-form")[0];

    if (checkProductFields($adminProductForm, category, productName, description, quantity, price)) {
      let prodId  = getProductIdCounter();
      let product = new Product(prodId, category, productName, description, quantity, price, imageUrl);
      let productDB  = getProductDatabase();
      let index   = productDB.length;
      productDB.push(product);
      saveProductDatabase(productDB);
      saveProductIdCounter(++prodId);
      saveTotalProducts(getProductDatabase().length);
      $("#total-products").text(getTotalProducts());
      $("#clearAddProductForm").click();
      $("#admin-product-grid").append(generateAdminProductCard(product, index));
      alert("Successfully added item.");
    }
  });

  /* Open Edit Modal */
  $(document).on("click", ".editProductBtn", function () {
    let product = getProductDatabase()[$(this).data("id")];
    $("#update-product-category").val(product.getCategory());
    $("#update-product-name").val(product.getProductName());
    $("#update-product-description").val(product.getDescription());
    $("#update-product-quantity").val(product.getQuantityInStock());
    $("#update-product-price").val(product.getPrice());
    $("#update-product-image-url").val(product.getImageUrl());
    $("#updateProductBtn").data("id", $(this).data("id"));
    $(".modal-backdrop").removeClass("hidden").hide().fadeIn(400);
    $("#admin-update-product-section").removeClass("hidden").hide().fadeIn(400);
  });

  /* Close Modal */
  $(document).on("click", ".modal-backdrop, #closeUpdateModal", function () {
    $(".modal-backdrop").fadeOut(200);
    $("#admin-update-product-section").fadeOut(200);
  });

  /* Update Product */
  $("#updateProductBtn").on("click", function () {
    let category    = $("#update-product-category").val().trim();
    let productName = $("#update-product-name").val().trim();
    let description = $("#update-product-description").val().trim();
    let quantity    = $("#update-product-quantity").val().trim();
    let price       = $("#update-product-price").val().trim();
    let imageUrl    = $("#update-product-image-url").val().trim();
    let $updateProductForm = $("#update-product-form")[0];

    if (checkProductFields($updateProductForm, category, productName, description, quantity, price)) {
      let id = Number($(this).data("id"));
      let productDB = getProductDatabase();
      let product = productDB[id];
      let updatedProduct = new Product(product.getProductId(), category, productName, description, quantity, price, imageUrl);
      productDB[id] = updatedProduct;
      
      saveProductDatabase(productDB);
      $("#admin-product-grid").empty();
      renderAdminProductCards();
      alert("Successfully Updated Product");
      
      $(".modal-backdrop").click();
    }
  });

  /* Delete Product */
  $(document).on("click", ".deleteProductBtn", function () {
    if (!confirm("Are you sure you want to delete this product?")) return;
    let productDB = getProductDatabase();
    productDB.splice($(this).data("id"), 1);
    saveProductDatabase(productDB);
    $("#admin-product-grid").empty();
    renderAdminProductCards();
    alert("Successfully Deleted!");
    saveTotalProducts(getProductDatabase().length);
    $("#total-products").text(getTotalProducts());
  });

  /* Transaction action colour coding */
  $("#txn-action-select").on("change", function () {
    let colors = {
      "confirm-payment":  "#88f3a1",
      "process-shipment": "#cce5ff",
      "mark-delivered":   "#fff3cd",
      "process-return":   "#f8d7da",
      "issue-refund":     "#e1a6f0",
      "cancel-order":     "#f5c6cb"
    };
    $(this).css("background-color", colors[$(this).val()] || "");
  });

  $("[type='reset']").click(function () {
    $("#txn-action-select").css("background-color", "");
  });

  /* Init: load product count + render cards */
  if (!getIsAdminLoggedIn()) {
    location.replace("../html/auth.html");
  }

  let productDB = getProductDatabase();
  $("#total-products").text(productDB.length);
  saveTotalProducts(productDB.length);
  renderAdminProductCards();
});
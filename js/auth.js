/* auth.js — Login page logic. Requires: shared.js */


/* =====================
   VALIDATION HELPERS
   ===================== */

function checkAdminCredentials(username, password) {
  let adminDatabase = getAdminDatabase();
  let matchedAdmin = null;
  for (let index = 0; index < adminDatabase.length; index++) {
    if (adminDatabase[index].getUsername() === username && adminDatabase[index].getPassword() === password) {
      matchedAdmin = adminDatabase[index];
      break;
    }
  }
  return matchedAdmin;
}

function checkCustomerCredentials(username, password) {
  let matchedCustomer = null;
  $(getCustomerDatabase()).each(function (index, account) {
    if (account.getUsername() === username && account.getPassword() === password) {
      matchedCustomer = account;
      return false; // stop loop
    }
  });
  return matchedCustomer;
}

// Checks credentials against both admin and customer databases, then redirects accordingly
function validateLogin(username, password) {
  let admin = checkAdminCredentials(username, password);
  if (admin !== null) {
    saveIsAdminLoggedIn(true);
    saveLoggedInAdmin(admin);
    showAlert("success", "Authenticated", "Welcome, @" + username, function () {
      location.replace("../html/admin.html");
    });
    return true;
  }

  let customer = checkCustomerCredentials(username, password);
  if (customer !== null) {
    saveLoggedInCustomer(customer);
    showAlert("success", "Authenticated", "Welcome, @" + username, function () {
      location.replace("../html/customer.html");
    });
    return true;
  }

  $("#account-login-error").text("Invalid username or password. Please try again.");
  return false;
}

function clearLoginFields() {
  $("#login-username").val("");
  $("#login-password").val("");
  $("#account-login-error").text("");
}


/* =====================
   LOGIN FORM
   ===================== */

$(document).ready(function () {

  $("#loginBtn").click(function () {
    let username = $("#login-username").val();
    let password = $("#login-password").val();
    if (validateLogin(username, password)) {
      clearLoginFields();
    }
  });

  $(".password-toggle-btn").click(function () {
    showHidePassword($(this).prev(), $(this));
  });

});
/* ================================================================
   auth.js  —  Login page
   Depends on: shared.js (Account, getCustomerDatabase)
   ================================================================ */

/* ---- HELPERS ---- */

function checkAdminCredentials(username, password) {
  let adminDB = getAdminDatabase();
  let found = null;
  for (let i = 0; i < adminDB.length; i++) {
    if (adminDB[i].getUsername() === username && adminDB[i].getPassword() === password) {
      found = adminDB[i];
      break;
    }
  }
  return found;
}

function checkCustomerCredentials(username, password) {
  let returnValue = null;
  $(getCustomerDatabase()).each(function (index, account) {
    if (account.getUsername() === username && account.getPassword() === password) {
      returnValue = account;
      return false; // break
    }
  });
  return returnValue;
}

function validateLogin(username, password) {
  let admin = checkAdminCredentials(username, password);
  if (admin !== null) {
    saveIsAdminLoggedIn(true);
    saveLoggedInAdmin(admin);
    location.replace("../html/admin.html");
    return true;
  }

  let account = checkCustomerCredentials(username, password);
  if (account !== null) {
    saveLoggedInCustomer(account);
    location.replace("../html/customer.html");
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

/* ---- EVENTS ---- */

$(document).ready(function () {
  /* Login submit */
  $("#loginBtn").click(function () {
    let username = $("#login-username").val();
    let password = $("#login-password").val();
    if (validateLogin(username, password)) {
      clearLoginFields();
    }
  });

  /* Toggle password visibility */
  $(".password-toggle-btn").click(function () {
    showHidePassword($(this).prev(), $(this));
  });

  if (getIsAdminLoggedIn()) {
    location.replace("../html/admin.html");
  }
});
/* ================================================================
   auth.js  —  Login page
   Depends on: shared.js (Account, getCustomerDatabase)
   ================================================================ */

/* ---- HELPERS ---- */

function isAdmin(username, password) {
  return username === "lumiereAdmin" && password === "admin123";
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
  if (isAdmin(username, password)) {
    saveIsAdminLoggedIn(true);
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
  $("#login-show-password").click(function () {
    let $pw = $("#login-password");
    let type = $pw.attr("type") === "password" ? "text" : "password";
    $pw.attr("type", type);
    $(this).text(type === "password" ? "Show" : "Hide");
  });

  if (getIsAdminLoggedIn()) {
    location.replace("../html/admin.html");
  }
});
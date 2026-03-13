/* createAccount.js — Create Account page logic. Requires: shared.js */


/* =====================
   VALIDATION HELPERS
   ===================== */

function checkCreateAccountFields(fullName, email, contactNumber, deliveryAddress,
                                   username, password, confirmPassword) {
  let isValid = true;

  if (!fullName || fullName.length < 3) {
    $("#signup-fullname-error").text("Full name is required and must be at least 3 characters.");
    isValid = false;
  } else {
    $("#signup-fullname-error").text("");
  }

  let atIndex = email.indexOf("@");
  let dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex ||
      email.includes(" ") || !email.endsWith(".com")) {
    $("#signup-email-error").text("Email is required and must be valid.");
    isValid = false;
  } else {
    $("#signup-email-error").text("");
  }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $("#signup-contact-error").text("Contact number is required, must be at least 8 digits, and valid.");
    isValid = false;
  } else {
    $("#signup-contact-error").text("");
  }

  if (!deliveryAddress || deliveryAddress.length < 10) {
    $("#signup-address-error").text("Delivery address is required and must be at least 10 characters.");
    isValid = false;
  } else {
    $("#signup-address-error").text("");
  }

  if (!username || username.length < 3 || username.length > 20 || username.includes(" ")) {
    $("#signup-username-error").text("Username must be 3-20 characters with no spaces.");
    isValid = false;
  } else {
    $("#signup-username-error").text("");
  }

  if (!password || password.length < 8) {
    $("#signup-password-error").text("Password is required and must be at least 8 characters.");
    isValid = false;
  } else {
    $("#signup-password-error").text("");
  }

  if (password !== confirmPassword) {
    $("#signup-confirm-password-error").text("Passwords do not match.");
    isValid = false;
  }

  // Check if the username is already taken
  let customerDatabase = getCustomerDatabase();
  if (customerDatabase.length > 0) {
    $(customerDatabase).each(function (index, account) {
      if (account.getUsername() === username) {
        $("#signup-username-error").text("Username already exists. Please choose another.");
        isValid = false;
        return false; // stop loop
      }
    });
  }

  return isValid;
}

function clearCreateAccountFields() {
  $("#signup-form")[0].reset();
  $(".validation-msg", "#signup-form").text("");
}


/* =====================
   CREATE ACCOUNT FORM
   ===================== */

$(document).ready(function () {

  $("#createAccountBtn").click(function () {
    let fullName        = $("#signup-fullname").val().trim();
    let email           = $("#signup-email").val().trim();
    let contactNumber   = $("#signup-contact").val().trim();
    let deliveryAddress = $("#signup-address").val().trim();
    let username        = $("#signup-username").val().trim();
    let password        = $("#signup-password").val();
    let confirmPassword = $("#signup-confirm-password").val();

    if (checkCreateAccountFields(fullName, email, contactNumber, deliveryAddress,
                                  username, password, confirmPassword)) {
      let newAccount = new Account(fullName, email, contactNumber, deliveryAddress, username, password, []);
      let customerDatabase = getCustomerDatabase();
      customerDatabase.push(newAccount);
      saveCustomerDatabase(customerDatabase);

      clearCreateAccountFields();
      showAlert("success", "Account Created!", "Your account has been created successfully. Please log in.", function () {
        location.replace("../html/auth.html");
      });
    }
  });

  $(".password-toggle-btn").click(function () {
    showHidePassword($(this).prev(), $(this));
  });

});
/* createAccount.js - Create Account page. Depends on: shared.js */

/* ---- VALIDATION ---- */

function checkCreateAccountFields(fullName, email, contactNumber, deliveryAddress,
                                   username, password, confirmPassword) {
  let valid = true;

  if (!fullName || fullName.length < 3) {
    $("#signup-fullname-error").text("Full name is required and must be at least 3 characters.");
    valid = false;
  } else { $("#signup-fullname-error").text(""); }

  let atIndex = email.indexOf("@"), dotIndex = email.lastIndexOf(".");
  if (!email || atIndex === -1 || dotIndex === -1 || atIndex > dotIndex ||
      email.includes(" ") || !email.endsWith(".com")) {
    $("#signup-email-error").text("Email is required and must be valid.");
    valid = false;
  } else { $("#signup-email-error").text(""); }

  if (!contactNumber || Number.isNaN(Number(contactNumber)) || contactNumber.length < 8) {
    $("#signup-contact-error").text("Contact number is required, must be at least 8 digits, and valid.");
    valid = false;
  } else { $("#signup-contact-error").text(""); }

  if (!deliveryAddress || deliveryAddress.length < 10) {
    $("#signup-address-error").text("Delivery address is required and must be at least 10 characters.");
    valid = false;
  } else { $("#signup-address-error").text(""); }

  if (!username || username.length < 3 || username.length > 20 || username.includes(" ")) {
    $("#signup-username-error").text("Username must be 3-20 characters with no spaces.");
    valid = false;
  } else { $("#signup-username-error").text(""); }

  if (!password || password.length < 8) {
    $("#signup-password-error").text("Password is required and must be at least 8 characters.");
    valid = false;
  } else { $("#signup-password-error").text(""); }

  if (password !== confirmPassword) {
    $("#signup-confirm-password-error").text("Passwords do not match.");
    valid = false;
  }

  // Check for duplicate username
  let customerDB = getCustomerDatabase();
  if (customerDB.length > 0) {
    $(customerDB).each(function (index, account) {
      if (account.getUsername() === username) {
        $("#signup-username-error").text("Username already exists. Please choose another.");
        valid = false;
        return false; // break $.each
      }
    });
  }

  return valid;
}

function clearCreateAccountFields() {
  $("#signup-form")[0].reset();
  $(".validation-msg", "#signup-form").text("");
}

/* ---- EVENTS ---- */

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
      let customerDB = getCustomerDatabase();
      customerDB.push(newAccount);
      saveCustomerDatabase(customerDB);

      clearCreateAccountFields();
      alert("Account created successfully! Please log in.");
      location.replace("../html/auth.html");
    }
  });

  $(".password-toggle-btn").click(function () {
    showHidePassword($(this).prev(), $(this));
  });
});
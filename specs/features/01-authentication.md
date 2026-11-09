# Feature Specification: 3.1.1 User Authentication (Registration & Login)

### 3.1.1 User Authentication (Registration & Login)

**User Story:**  
As a university member (Student, Teacher, or Staff), I want to register using my official institutional email address, verify my account through a one-time password (OTP), log in securely using my credentials, reset my password if needed, and log out when finished, so that I can securely access the platform.

**Success:**
- **Registration:**
  - User opens the registration page.
  - User submits the registration form with Full Name, official university email address (`@juniv.edu`), password (minimum 6 characters), institutional role (Student, Faculty, or Staff), and an optional indicator to be considered for a moderator role.
  - System verifies that the email address is unique, properly structured, and belongs to the institutional domain.
  - System registers a pending account, securely hashes the password using cryptographic protection, generates a 6-digit numeric OTP valid for 10 minutes, and sends it to the user's email address.
  - User is directed to the email verification screen.
  - User enters the 6-digit OTP code received in their email.
  - Upon successful verification, the user account is activated, the consumed verification code is invalidated, and an authenticated session is established.
- **Login:**
  - Registered user enters their registered institutional email address and password.
  - System authenticates the user's credentials against the securely stored password hash.
  - Upon successful authentication, the system issues a secure session token, resets any previous failed login counters, and directs the user to the home dashboard.
- **Password Reset & Account Recovery:**
  - User requests a password reset by submitting their registered institutional email address.
  - System confirms the account exists, generates a temporary verification OTP, and emails it to the user.
  - After entering a valid verification OTP, the user provides a new password meeting security criteria, and the account credentials are updated.
- **Logout:**
  - User selects the logout option from any authenticated page.
  - System terminates the active session and redirects the user to the login screen.

**Failure:**
- If the email address is missing or does not belong to the institutional domain (`@juniv.edu`), the system displays: *"Please provide a valid official university email address."*
- If the email address is already registered with an active account, the system displays: *"This email address is already registered."*
- If the password is shorter than the minimum requirement of 6 characters, the system displays: *"Password must be at least 6 characters long."*
- If an invalid or expired OTP code is entered, the system displays: *"Invalid or expired OTP. Please try again or request a new code."*
- If incorrect login credentials are submitted, the system displays: *"Invalid email or password."*
- If an account experiences 5 consecutive failed login attempts within a short timeframe, the system temporarily locks the account for 15 minutes and displays: *"Account temporarily locked due to too many failed attempts. Please try again in 15 minutes."*
- If a user attempts to log in before completing email verification, the system prompts them to complete the OTP verification step.
- If the account has been suspended or rejected by an administrator, the system displays: *"Your account has been suspended or is not active. Please contact administration."*

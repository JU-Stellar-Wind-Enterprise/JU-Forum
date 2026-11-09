# Software Requirements Specification (SRS)

# JU Forum
> A Centralized Communication Platform for Jahangirnagar University

---

# Chapter 1: Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document describes the requirements for **JU Forum**, a centralized online communication and discussion platform designed exclusively for the community of Jahangirnagar University. This document outlines the functional and non-functional requirements, system features, performance expectations, security requirements, constraints, user interactions, and external interfaces necessary for the development, deployment, operation, and maintenance of the platform.

### 1.2 Intended Audience
This SRS document is intended for the following audiences:
- **Project Developers:** To understand the system requirements and implement the University Discussion Forum.
- **System Testers:** To verify that the implemented system satisfies all specified requirements.
- **Project Supervisors and Stakeholders:** To review the project scope, objectives, and expected functionalities.
- **University Administrators and Moderators:** To understand the management and moderation features of the system.
- **Future Maintenance Teams:** To assist in maintaining, upgrading, and extending the system after deployment.

### 1.3 Intended Use
This document serves different groups of stakeholders:
- **1.3.1 Students, Teachers, and Staff Members:** Focus on the Introduction, Overall Description, and Functional Requirements sections.
- **1.3.2 Moderators and Administrators:** Review the User Management, Moderation, and Security Requirements sections.
- **1.3.3 Developers:** Read the entire SRS document, paying special attention to Functional Requirements, Non-Functional Requirements, Architecture, and Database Models.
- **1.3.4 Testers:** Focus on the Functional Requirements, Non-Functional Requirements, and Exception Handling scenarios.
- **1.3.5 Project Supervisors and Stakeholders:** Review the Introduction, System Scope, and Functional Requirements to evaluate the project's objectives and feasibility.

### 1.4 Product Scope
JU Forum is a dedicated web platform for Jahangirnagar University students, faculty, and campus staff to communicate in an organized, official space rather than fragmented social media groups.

#### 1.4.1 Purpose
The system provides a structured, verified environment where university members can share academic materials, discuss campus initiatives, publish announcements, and ask questions.

#### 1.4.2 Benefits and Objectives
- **Centralized Communication:** A unified platform for all university members.
- **Organized Discussions:** Categorized subforums and discussion threads.
- **Official Information Sharing:** Faculty and administration can publish targeted announcements.
- **Knowledge Retention:** Preserves academic knowledge and campus insights across student batches.
- **Community Engagement:** Interactive voting, discussions, and student polls.
- **Searchability:** Easily discover historical campus discussions and announcements.

#### 1.4.3 Alignment with Institutional Goals
The platform fosters a civil, academically focused digital environment, streamlining communication between students, teachers, and campus administrative bodies.

#### 1.4.4 Strategic Positioning
JU Forum reduces reliance on third-party commercial social media for official university communications, providing an authenticated and accountable campus platform.

### 1.5 Risk Definition
- **1.5.1 Technical Load:** High concurrency during peak academic events (e.g., admissions, exam schedules).
- **1.5.2 Security & Abuse:** Unauthorized access attempts, spam posting, or abusive language.
- **1.5.3 Identity Verification:** Ensuring all registered users possess valid institutional email credentials.
- **1.5.4 Content Moderation:** High volume of user-generated content requiring timely moderation.
- **1.5.5 Changing Requirements:** Evolving university policies requiring flexible and extensible system design.

---

# Chapter 2: Overall Description

### 2.1 User Classes and Characteristics

#### 2.1.1 Forum Citizens (Students, Faculty, Staff)
- Encompasses all verified members of the Jahangirnagar University community with an active `@juniv.edu` email account.
- Capabilities: Create discussion posts, comment on threads, vote on content, view public profiles, browse subforums, and participate in community polls.

#### 2.1.2 Forum Moderators
- Trusted community members or appointed student representatives.
- Capabilities: Possess standard citizen capabilities plus permissions to lock/archive discussion threads, review reported content, hide rule-violating posts, and manage assigned subforums.

#### 2.1.3 Forum Admins (Department Heads, Faculty Leaders)
- Faculty members or department administrators.
- Capabilities: Approve or reject new subforum creation requests, publish official campus announcements, appoint or revoke moderator privileges, and override localized moderation decisions.

#### 2.1.4 System Admins (IT Administrators)
- University technical administrators.
- Capabilities: Manage global system settings, resolve user authentication issues, handle database maintenance, suspend abusive accounts platform-wide, and oversee core infrastructure.

---

### 2.2 User Needs

#### 2.2.1 Student Needs
- **Insulated Campus Network:** A private, secure discussion space free from external social media noise and outside trolling.
- **Cross-Batch Knowledge Sharing:** Access to guidance, course advice, and contest preparation from senior batches and alumni.
- **Context-Driven Searchability:** Rapid search across subforums and threads for answers to recurring campus procedures.
- **Student Coordination:** Thematic subforums for batches, clubs, and campus activities.

#### 2.2.2 Faculty and Staff Needs
- **Verified Official Communication:** A trustworthy channel to post notices and departmental updates without student impersonation.
- **Confidentiality:** Academic discussions and administrative procedures remain strictly within the campus community.
- **Reduced Redundancy:** A central repository where recurring inquiries can be answered once and referenced by students across batches.

#### 2.2.3 Administrative and Governance Needs
- **Institutional Gateway:** Strict registration requirement enforcing `@juniv.edu` email verification.
- **Accountability & Civil Discourse:** Identity-mapped accounts deter anonymous harassment and toxic platform behavior.
- **Localized Moderation:** Delegation of moderation duties to specific subforums and department spaces.

---

### 2.3 Operating Environment

#### 2.3.1 Server Environment
- **Runtime:** Node.js (Version 20.x / 22.x LTS or higher)
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL managed via Prisma ORM
- **Hosting:** University IT server infrastructure or cloud platforms (Vercel, Dockerized Linux environment)

#### 2.3.2 Client Environment
- **Platform:** Cross-platform web browsers (Desktop, Tablet, Mobile)
- **Supported Browsers:** Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge (modern ECMAScript standard)

#### 2.3.3 Network Environment
- **Protocols:** HTTPS (SSL/TLS encrypted data transmission)
- **Connectivity:** Accessible via campus Wi-Fi, broadband, and cellular networks

---

### 2.4 Constraints
- **Technical:** Must follow strict TypeScript typing, 3-Layered Clean Architecture, and Next.js App Router conventions.
- **Security & Privacy:** Store only necessary user data (Name, Email, Role, Batch); passwords hashed via bcrypt; session cookies signed via HMAC SHA-256.
- **Budget:** Built using open-source, free-tier technologies without commercial licensing costs.
- **Timeframe:** Core features deliverable within the academic project timeline.

---

### 2.5 Assumptions
- **User Literacy:** Users have basic familiarity with web applications.
- **Email Access:** Users have active access to their official `@juniv.edu` email accounts to receive verification OTPs.
- **Infrastructure:** Stable server hosting and internet connectivity are maintained by the university.

---

# Chapter 3: Specific Requirements

## 3.1 Functional Requirements

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

---

### 3.1.2 View Profile

**User Story:**  
As a user (Student, Teacher, or Staff), I want to view my own profile and the public profiles of other forum members, so that I can see member details, institutional roles, academic departments, and community contributions.

**Success:**
- Authenticated user opens their personal profile page or clicks on any member's username or avatar.
- System retrieves and displays the member's profile information: Full Name, Display Nickname, Institutional Role (Student, Faculty, Staff, Moderator, or Admin), Department, Academic Batch, Avatar Image, About Me biography, and Academic Interest Tags.
- When viewing their own profile, the user is provided with controls to edit their profile details.
- System displays a summary of the member's recent posts, discussions, and community engagement.
- The profile display automatically reflects recent updates made by the account owner.

**Failure:**
- If an unauthenticated user attempts to view a member profile, the system redirects them to the login page.
- If the requested member profile does not exist, the system displays a *"Page Not Found"* message.
- If profile data cannot be loaded due to a temporary network issue, the system displays: *"Unable to load profile information. Please try again later."*

---

### 3.1.3 Edit Profile

**User Story:**  
As a registered user, I want to customize my profile by updating my display nickname, avatar image, "About Me" biography, and interest tags, so that my profile accurately represents my identity and academic interests.

**Success:**
- User opens the profile editing interface.
- User updates their display nickname:
  - System verifies that the nickname is unique across the platform, contains no spaces or offensive content, and enforces a 7-day modification cooldown to prevent abuse.
- User updates their avatar image by providing a valid image URL or uploading a supported image file.
- User edits their "About Me" biography (up to 500 characters); system automatically sanitizes the text to prevent script injection.
- User selects or adds academic interest tags (up to a maximum of 10 tags).
- User confirms the changes, and the system saves the updated profile, displaying: *"Profile updated successfully."*

**Failure:**
- If the proposed nickname contains invalid characters or offensive terms, the system displays: *"Invalid nickname provided."*
- If the user attempts to update their nickname before the 7-day cooldown period has elapsed, the system displays: *"Nickname can only be changed once every 7 days."*
- If the biography exceeds the 500-character limit, the system displays: *"About Me text exceeds the allowed 500-character limit."*
- If the user attempts to add duplicate interest tags or exceeds the 10-tag limit, the system rejects the addition with an informative notice.
- If a system error occurs during the save operation, the system displays: *"Unable to update profile. Please try again later."*

---

### 3.1.4 Subforum Management (Create & Browse)

**User Story:**  
As a university member, I want to browse existing subforums and propose or create new thematic discussion spaces for departments, batches, clubs, or academic interest groups, so that our community has structured communication channels.

**Success:**
- User opens the subforum directory to view all available discussion spaces with their title, description, creator, and activity count.
- User opens the subforum creation interface to submit a new discussion space.
- User enters the proposed Subforum Name (1 to 80 characters) and Description (1 to 500 characters).
- System validates that the subforum name is unique across the forum.
- System registers the subforum, assigns the creator as the initial subforum owner/moderator, and applies the platform approval workflow.
- Once active, the subforum becomes visible in the public directory, allowing members to open it and start discussion threads inside it.

**Failure:**
- If a subforum with the same name already exists, the system displays: *"A subforum with this name already exists."*
- If the subforum name is blank or exceeds 80 characters, the system displays: *"Subforum name must be between 1 and 80 characters."*
- If the description exceeds 500 characters, the system displays: *"Description cannot exceed 500 characters."*
- If an unauthenticated user attempts to create a subforum, the system redirects them to the login screen.
- If subforum creation fails due to a system issue, the system displays: *"Could not create subforum. Please try again."*

---

### 3.1.5 Create & Manage Posts

**User Story:**  
As an active forum member, I want to publish discussion posts inside approved subforums, so that I can ask academic questions, initiate discussions, and share knowledge with university peers.

**Success:**
- Authenticated user opens the post creation page.
- User selects a target Subforum from the available categories, enters a post Title (1 to 150 characters), and provides Body Content (1 to 10,000 characters).
- System verifies that the target subforum is active and that content lengths meet validation constraints.
- System publishes the post and links it to the author and the selected subforum.
- User is directed to the published post page, where the discussion thread displays the title, body content, author name, timestamp, subforum tag, and interactive voting controls.
- The author or an authorized moderator can lock or archive the discussion thread when a topic is resolved or closed to prevent further interactions.

**Failure:**
- If the post title is missing or exceeds 150 characters, the system displays: *"Title must be between 1 and 150 characters."*
- If the body content is empty or exceeds 10,000 characters, the system displays: *"Content must be between 1 and 10,000 characters."*
- If no subforum is selected, the system displays: *"Please select a subforum."*
- If the author's account is suspended or inactive, the system blocks post creation.
- If post submission fails due to a network or server issue, the system displays: *"Could not create post. Please try again."*

---

### 3.1.6 Comments & Discussion Replies

**User Story:**  
As an authenticated user, I want to write comments and replies under discussion posts, so that I can answer questions, contribute insights, and actively engage with the campus community.

**Success:**
- User opens a discussion post and types a response into the comment input field.
- System verifies that the comment is not empty and falls within allowed length limits (up to 2,000 characters).
- System publishes the comment under the target post, displaying the commenter's name, role badge, timestamp, and voting controls.
- Comment author can edit or remove their own comments.
- Subforum moderators and administrators can remove inappropriate comments that violate community standards.

**Failure:**
- If the discussion thread has been locked or archived, the comment interface is disabled, displaying: *"Comments are closed for this post."*
- If the submitted comment text is empty, the system displays: *"Comment cannot be empty."*
- If an unauthenticated user attempts to comment, the system redirects them to the login page.
- If comment submission fails due to server connectivity, the system displays: *"Unable to post comment. Please try again."*

---

### 3.1.7 Content Voting System

**User Story:**  
As an authenticated forum member, I want to upvote or downvote discussion posts and comments, switch my vote, or remove my vote, so that valuable academic content is highlighted and community feedback is reflected.

**Success:**
- User clicks the Upvote or Downvote button on any active discussion post or comment.
- System records the vote and updates the total score (upvotes minus downvotes) dynamically.
- The user interface immediately highlights the active voting button to provide visual confirmation.
- If the user clicks the same vote button a second time, the system removes their vote and resets the score.
- If the user clicks the opposite vote button, the system switches the vote (e.g., from upvote to downvote) and recalculates the score accordingly.
- Authors are permitted to vote on their own published content.

**Failure:**
- If a post is locked or archived, voting controls are disabled, and submission attempts return: *"Voting is disabled on locked or archived content."*
- If an unauthenticated user attempts to cast a vote, the system redirects them to the login page.
- If a suspended user attempts to vote, the system displays: *"Suspended accounts cannot participate in voting."*
- If network communication fails, the user interface indicates a temporary network issue without altering the persistent score.

---

### 3.1.8 Community Polls

**User Story:**  
As a user (Student, Teacher, or Staff), I want to create polls within discussion topics and vote on poll options, so that I can collect opinions, student feedback, and community sentiment.

**Success:**
- User opens the poll creation interface, enters the poll question, descriptive context, at least two voting options, and an optional poll closing date.
- System validates the fields and publishes the poll within the designated discussion space.
- Authorized users can view the poll and cast a single vote for their preferred option.
- System records each vote, prevents duplicate submissions from the same user, and updates percentage bars and vote totals automatically.
- When the poll reaches its scheduled closing date or is closed by the author/moderator, voting is disabled and final tallies remain archived for viewing.

**Failure:**
- If the poll question is missing or fewer than two options are provided, the system displays: *"Poll creation failed. Please enter a question and at least two voting options."*
- If a user attempts to vote more than once in the same poll, the system rejects the duplicate submission.
- If a user attempts to vote in a closed or expired poll, the system displays: *"This poll is closed and no longer accepting votes."*
- If an unauthenticated user attempts to vote, the system redirects them to the login page.

---

### 3.1.9 Campus Announcements

**User Story:**  
As an authorized user (Teacher, Staff, Moderator, or Administrator), I want to author and publish official campus announcements with priority levels, target audience filters, and expiration dates, so that important institutional updates reach the intended audience promptly.

**Success:**
- User with authorized role (Faculty, Staff, Moderator, or Administrator) opens the announcement creation page.
- User enters the announcement Title (1 to 150 characters), Body Content (up to 10,000 characters), Priority Level (Low, Medium, High, or Urgent), Target Audience (All Users, Students, Faculty, or Staff), and an optional future Expiration Date.
- System validates the input, confirms role permissions, and publishes the announcement.
- The published announcement appears in the announcement feed and is displayed only to members belonging to the target audience (or all members if set to All Users).
- High-priority and urgent announcements are visually distinguished and pinned at the top of the announcement feed.
- The author or an administrator can edit or delete the announcement.
- Announcements that pass their expiration date are automatically hidden from the active feed.

**Failure:**
- If a general student account attempts to access the announcement creation form, the system blocks the request and displays: *"You do not have permission to create announcements."*
- If the title or content is empty or exceeds length limitations, the system displays: *"Please provide a valid title and announcement content."*
- If an expiration date in the past is selected, the system displays: *"Expiration date must be in the future."*
- If announcement publication fails due to a system issue, the system displays: *"Failed to publish announcement. Please try again."*

---

### 3.1.10 Personalized News Feed

**User Story:**  
As an authenticated user, I want to view an aggregated news feed on my home dashboard containing recent discussions, followed subforum updates, and official announcements, so that I can stay informed about university activities from a single page.

**Success:**
- Upon accessing the home dashboard, the system displays a unified feed composed of recent discussions from active subforums and relevant campus announcements matching the user's role.
- User can apply feed sorting and filtering options (such as "Latest", "Most Upvoted", or followed topics).
- Each discussion card presents the post title, author, subforum tag, vote count, and comment summary.
- User interactions on the feed (such as voting or opening threads) update smoothly without requiring full-page reloads.
- The feed supports structured pagination or continuous loading to optimize performance.

**Failure:**
- If an unauthenticated user visits the home feed, the system redirects them to the login page.
- If feed data cannot be fetched due to network interruption, the system displays: *"Unable to load feed items. Please refresh."*
- If a subforum is removed or archived, its posts are gracefully excluded from the active news feed.

---

### 3.1.11 Content Reporting & Flagging

**User Story:**  
As a forum member, I want to flag and report inappropriate, abusive, or spam content to moderators, so that the platform maintains a safe, respectful, and productive academic environment.

**Success:**
- User clicks the "Report" option on any post, comment, or announcement.
- User selects a reporting reason (Spam, Harassment, Offensive Content, False Information, Academic Misconduct, or Other) and optionally provides explanatory remarks.
- System validates the report and logs it in the moderation review queue.
- System confirms report submission to the user: *"Thank you. Your report has been submitted for moderator review."*
- System prevents duplicate reports by the same user on the same content item.
- Moderators can inspect reported content, review report reasons, dismiss unfounded reports, or take corrective action (such as hiding content, deleting posts, or warning users).

**Failure:**
- If no reporting reason is selected, the system displays: *"Please select a valid reason for reporting."*
- If the user has already reported the specific item, the system displays: *"You have already reported this content."*
- If the reported content has already been removed, the system displays: *"This content is no longer available."*
- If an unauthenticated user attempts to submit a report, the system redirects them to the login page.

---

### 3.1.12 Admin Dashboard & User Management

**User Story:**  
As a university forum Administrator or System Administrator, I want to access a dedicated administration dashboard to view platform activity metrics, manage user roles, review moderator applications, and suspend rule-violating accounts, so that I can ensure institutional safety and administrative oversight.

**Success:**
- Administrator logs in with elevated credentials and accesses the administrative dashboard.
- Dashboard displays real-time platform statistics, including total registered users, active subforums, published discussions, and pending moderation reports.
- Administrator can search and review user accounts, filter by role (Student, Faculty, Staff, Moderator), and update account statuses (Active, Suspended, or Rejected).
- Administrator can review pending moderator applications and grant or revoke moderator privileges.
- Administrator can publish platform-wide alert notices visible across all user feeds.
- Suspending an account immediately terminates active sessions and blocks future login attempts.

**Failure:**
- If a non-admin user attempts to access administrative pages, the system blocks access and returns an unauthorized access warning.
- If an administrator attempts to suspend their own account or modify another top-level administrator's permissions, the system blocks the action with an error notification.
- If database synchronization fails during an account update, the system rolls back the change and displays: *"Unable to update user status. Please try again."*

---

## 3.2 Non-Functional Requirements

### 3.2.1 Performance Requirements
- **Concurrent User Load:** The system must support at least 100 concurrent users performing reading, posting, and voting operations without significant performance degradation.
- **Execution Timeframe:** Core user workflows—including feed loading, post creation, and voting interactions—must complete within 800 milliseconds to 2 seconds under standard network conditions.
- **Memory & Resource Efficiency:** Client-side data loading for long discussion feeds must be paginated or chunked to maintain a lightweight memory footprint below 150 MB on standard client devices.

### 3.2.2 Safety & Data Integrity Requirements
- **Transactional Consistency:** Database operations (such as registration verification, post creation, and voting adjustments) must strictly uphold transactional integrity to prevent data inconsistency or loss.
- **Relational Integrity:** Cascading rules and entity relationships must prevent orphaned records when users or discussion spaces are updated or removed.
- **Institutional Compliance:** The platform must comply with Jahangirnagar University institutional guidelines and digital data protection standards.

### 3.2.3 Security Requirements
- **Secure Data Transmission:** All client-server communications must be encrypted using standard HTTPS and modern TLS protocols.
- **Credential Protection:** Passwords must be securely hashed using modern cryptographic algorithms before storage; plain-text passwords must never be stored, transmitted in logs, or exposed.
- **Session Security:** Authenticated user sessions must use secure, HTTP-only signed tokens with proper expiration controls to prevent session hijacking and cross-site scripting attacks.
- **Brute-Force Lockout:** Accounts must be temporarily locked for 15 minutes after 5 consecutive failed login attempts to safeguard against automated credential attacks.
- **Role-Based Access Control:** Strict authorization checks must be enforced on all server actions and data access operations based on the user's institutional role.

### 3.2.4 Spam & Abuse Prevention Requirements
- **Institutional Domain Gateway:** Account creation is strictly restricted to verified `@juniv.edu` email addresses.
- **Input Sanitization:** All user-submitted text fields (posts, comments, biographies) must undergo automated string validation and sanitization to filter out malicious scripts and formatted injection attacks.
- **Rate Limiting:** Submission endpoints must enforce rate limits to prevent automated spam flooding and denial-of-service attempts.

### 3.2.5 Software Quality Attributes
- **Availability:** The system must target 99.5% uptime during active academic periods, providing continuous access during critical university events such as admissions and semester examinations.
- **Usability:** The user interface must be clean, intuitive, and fully responsive across desktops, tablets, and mobile devices without requiring user training.
- **Maintainability:** The platform must follow a decoupled 3-Layered Clean Architecture separating Presentation, Business Logic, and Data Access layers, accompanied by clear technical documentation and automated test suites.
- **Portability:** The application must be cross-platform compatible, running seamlessly across standard server operating environments (Linux and containerized platforms) and modern web browsers.

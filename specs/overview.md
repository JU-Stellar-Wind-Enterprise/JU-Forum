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


---

# Non-Functional Requirements

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

# E-CHAT: A REAL-TIME SECURE WEB-BASED CHAT APPLICATION

## PROJECT PHASE II REPORT

**Submitted by:**
- MARVIN M VARGHESE (TKI23CS064)
- MUHAMMED SAJID (TKI20CS077)
- PARTHAN S (TKI20CS090)
- AZEEM N (TKI20CS038)

**To the APJ Abdul Kalam Technological University**
In partial fulfillment of the requirements for the award of the Degree of
**Bachelor of Technology in Computer Science and Engineering**

**Department of Computer Science and Engineering**
TKM Institute of Technology
Karuvelil, Kollam
**APRIL 2026**

---

## DECLARATION

We undersigned hereby declare that the project report "E-Chat: A Real-Time Secure Web-Based Chat Application", submitted for partial fulfillment of the requirements for the award of degree of Bachelor of Technology of the APJ Abdul Kalam Technological University, Kerala is a Bonafide work done by us under supervision of Dr. Ajesh F and Dr. Sanila S. This submission represents our ideas in our own words and where ideas or words of others have been included, we have adequately and accurately cited and referenced the original sources. We also declare that we have adhered to ethics of academic honesty and integrity and have not misrepresented or fabricated any data or idea or fact or source in our submission. We understand that any violation of the above will be a cause for disciplinary action by the institute and/or the University and can also evoke penal action from the sources which have thus not been properly cited or from whom proper permission has not been obtained. This report has not been previously formed the basis for the award of any degree, diploma or similar title of any other University.

Place: Kollam

MARVIN M VARGHESE
MUHAMMED SAJID
PARTHAN S
AZEEM N

---

## CERTIFICATE

**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING**
**TKM INSTITUTE OF TECHNOLOGY, KARUVELIL, KOLLAM**

This is to certify that the report entitled "E-Chat: A Real-Time Secure Web-Based Chat Application" submitted by MARVIN M VARGHESE, MUHAMMED SAJID, PARTHAN S, AZEEM N to the APJ Abdul Kalam Technological University in partial fulfillment of the requirements for the award of degree of Bachelor of Technology in COMPUTER SCIENCE AND ENGINEERING is a Bonafide record of the project work carried out by them under our guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.

**Internal Supervisors:**
- DR. AJESH F (Professor, Dept of CSE)
- DR. SANILA S (Assoc. Prof, Dept of CSE)

**Project Coordinator:**
- DR. AJESH F (Professor, Dept of CSE)

**Head of the Dept:**
- DR. NIJIL RAJ N (HOD, Dept of CSE)

---

## ACKNOWLEDGEMENT

First of all, we thank God Almighty for helping us to successfully complete our project work. We express our sincere thanks and a deep sense of humble gratitude to the Principal of this institution, DR. GOURI MOHAN L for providing all the necessary facilities.

We thank DR. NIJIL RAJ N, Head of the Department of Computer Science and Engineering, for all the words of inspiration.

Next, we would like to thank our project coordinator DR. AJESH F for his valuable advice.

We have great pleasure in expressing our deep sense of gratitude and obligation to our internal supervisors DR. AJESH F and DR. SANILA S for their valuable guidance and suggestions throughout the entire project work.

Last but certainly not the least, we would also like to thank all faculty of the Department of Computer Science and Engineering and our friends for their help and co-operation.

MARVIN M VARGHESE
MUHAMMED SAJID
PARTHAN S
AZEEM N

---

## ABSTRACT

E-Chat is a full-stack real-time communication platform designed and implemented as a web-based application for secure personal and group messaging. The system uses a FastAPI backend with Socket.IO for low-latency bidirectional communication and a Next.js frontend for responsive user interaction across desktop and mobile devices. Core features include JWT-based authentication, contact management, one-to-one and group chat, file sharing, typing indicators, read receipts, message reactions, message edit and delete operations, and call history logging. Browser-based voice and video calling is supported using WebRTC, while Socket.IO is used as the signaling channel for session establishment. The data layer is implemented using asynchronous SQLAlchemy with SQLite/PostgreSQL compatibility to support both development and production deployment. The application also includes profile management and password reset through OTP verification. The modular architecture, use of open-source technologies, and deployability on low-cost cloud platforms make E-Chat technically robust and economically feasible for educational institutions, startups, and small organizations that require a self-hosted and customizable communication solution.

**Keywords:** Real-time chat, FastAPI, Socket.IO, Next.js, WebRTC, JWT authentication.

---

## SUSTAINABLE DEVELOPMENT GOALS (SDG) MAPPING

The proposed E-Chat project contributes to selected United Nations Sustainable Development Goals by improving communication accessibility, supporting innovation in digital infrastructure, and reducing dependence on high-cost proprietary communication platforms.

| SDG No. | SDG Title | Alignment with E-Chat |
| :--- | :--- | :--- |
| SDG 9 | Industry, Innovation and Infrastructure | E-Chat uses modern software architecture and open standards to build reliable digital communication infrastructure for institutions and teams. |
| SDG 10 | Reduced Inequalities | Self-hosted and open-source deployment options help reduce access barriers for organizations with limited budgets. |
| SDG 11 | Sustainable Cities and Communities | Supports connected and collaborative communities through secure and scalable local communication platforms. |

---

## CO-PO MAPPING

**Course Outcomes (CO) Addressed:**
- **CO1:** Identify technically and economically feasible software engineering problems.
- **CO2:** Survey related literature and existing software systems.
- **CO3:** Perform requirement analysis, design, implementation, and testing using modern tools.
- **CO4:** Prepare technical reports and present engineering outcomes.
- **CO5:** Apply engineering and management principles for successful project completion.

**Program Outcomes (PO) Addressed:**
- **PO1:** Engineering Knowledge
- **PO2:** Problem Analysis
- **PO3:** Design/Development of Solutions
- **PO4:** Conduct Investigations of Complex Problems
- **PO5:** Modern Tool Usage
- **PO6:** The Engineer and Society
- **PO7:** Environment and Sustainability
- **PO8:** Ethics
- **PO9:** Individual and Team Work
- **PO10:** Communication
- **PO11:** Project Management and Finance
- **PO12:** Lifelong Learning

### CO-PO Mapping Table
(Key: \u2713 indicates CO matches PO)

| CO/PO | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| CO1 | \u2713 | \u2713 | \u2713 | \u2713 | | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 |
| CO2 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 |
| CO3 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 |
| CO4 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | | | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 |
| CO5 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | \u2713 | | \u2713 | \u2713 |

---

## TECHNICAL AND ECONOMIC FEASIBILITY

### 1. TECHNICAL FEASIBILITY
The proposed E-Chat system is technically feasible because it is implemented using stable and widely adopted technologies: FastAPI, Socket.IO, SQLAlchemy, and Next.js. The required software stack is open source, well documented, and compatible with standard development machines. No specialized hardware is required for development or deployment. The architecture supports modular expansion, making future enhancements such as distributed messaging and TURN relay integration practical.

### 2. ECONOMIC FEASIBILITY
The project is economically feasible for academic and small-scale industry adoption. Development uses free and open-source tools. Deployment can be done on affordable cloud instances with low recurring cost. Since the platform is self-hostable, organizations can avoid recurring per-user subscription charges of proprietary collaboration software. Therefore, the total ownership cost remains low while retaining customizability and data control.

---

## ABBREVIATIONS

- **API:** Application Programming Interface
- **ASGI:** Asynchronous Server Gateway Interface
- **DB:** Database
- **JWT:** JSON Web Token
- **OTP:** One-Time Password
- **P2P:** Peer-to-Peer
- **RTT:** Round Trip Time
- **SDP:** Session Description Protocol
- **STUN:** Session Traversal Utilities for NAT
- **TURN:** Traversal Using Relays around NAT
- **UI:** User Interface
- **WebRTC:** Web Real-Time Communication

---

## NOTATION

- **u:** Number of active users connected to the system
- **m:** Number of messages exchanged in a conversation
- **t_rtt:** Message round-trip latency (ms)
- **S_msg:** Size of message payload (bytes)
- **C_max:** Maximum concurrent users supported per node
- **C_deploy:** Monthly deployment cost (Rs./month)

---

# CHAPTER 1: INTRODUCTION

### 1.1 Background and Context
The rapid evolution of digital communication has transformed how individuals and organizations interact. Real-time messaging, once a luxury, is now a fundamental requirement for personal and professional collaboration. E-Chat is a secure, self-hostable web-based chat application designed to provide a privacy-focused alternative to centralized messaging services.

### 1.2 Problem Statement
Current centralized messaging platforms often face challenges regarding data privacy, high subscription costs, and lack of customization for organizational needs. Many proprietary systems also lack transparency in how user data is processed and stored. Many open-source alternatives provide only partial feature coverage or require significant customization before they can support direct messaging, group communication, file exchange, and browser-based calling in a single workflow.

### 1.3 Objectives
The primary objectives of the E-Chat project include:
1. To build a real-time messaging platform using Socket.IO.
2. To implement secure authentication using JWT and password hashing.
3. To provide browser-based audio and video communication via WebRTC signaling.
4. To ensure cost-effective and portable cloud deployment.

### 1.4 Scope and Limitations
Existing chat solutions frequently require high bandwidth and specialized hardware for self-hosted environments. Additionally, the lack of real-time multi-media capabilities in most open-source chat frameworks limits their utility for modern workplaces.

The scope of this project includes user authentication, contact-based communication, group chat, file sharing, and WebRTC call signaling. End-to-end encryption and distributed multi-node message brokering are outside the current implementation scope.

### 1.5 Industry Relevance
The project addresses current industrial trends and needs:
- **High Demand for Secure Communication:** Protecting intellectual property through private communication tools.
- **Open-Source Cost Efficiency:** Reducing SaaS subscription costs (Slack/Teams) with self-hosted solutions.
- **Real-Time API Ecosystem:** Using WebSockets and FastAPI for low-latency delivery.
- **Scalable Web Architecture:** Demonstrating a full-stack application integrating complex real-time workflows.

### 1.6 Proposed System
E-Chat implements a modular architecture:
- **Core Messaging:** Python-based Socket.IO backend for low-latency messaging and routing.
- **Media Communication:** Browser-native WebRTC managed through Socket.IO signaling.
- **Security Design:** JWT-based authentication, hashed password storage, and protected API endpoints.
- **User Interface:** Next.js and TypeScript for a responsive and modern user experience.

### 1.7 Organization of the Report
This report is organized into seven chapters covering introduction, review of literature, methodology/theory, work plan, experimental design/implementation, results/conclusion, and future scope.

---

# CHAPTER 2: REVIEW OF LITERATURE

### 2.1 Summary of Existing Work
Real-time communication has evolved from HTTP polling to persistent socket-based communication. Frameworks like Socket.IO improved reliability, while WebRTC introduced browser-native media channels. FastAPI and asynchronous Python have improved handling high connection counts.

### 2.2 Real-Time Messaging Platforms
Solutions like Slack and Discord show the importance of low-latency transport but are primarily cloud-hosted. E-Chat fills the gap for a modular, understandable, self-hostable project suitable for academic use.

### 2.3 Security Practices
Security involves secure authentication (JWT), robust password hashing (bcrypt), and server-side validation. E-Chat's current security layer provides a foundation for safe institutional deployment.

### 2.4 Gaps Identified
- Dependence on centralized proprietary infrastructure.
- High per-user subscription costs.
- Incomplete integration of messaging/calling in lightweight projects.
- Weak control over stored user data.

### 2.5 Contribution of E-Chat
- FastAPI + Socket.IO backend.
- Next.js frontend with responsive UI.
- Built-in WebRTC call signaling.
- Unified feature set (reactions, file sharing, etc.) in a self-hostable package.

---

# CHAPTER 3: METHODOLOGY / THEORY / MODELLING

### 3.1 Approach
Layered architecture:
1. **Presentation Layer:** Next.js interface.
2. **Communication Layer:** Socket.IO event routing.
3. **Data Layer:** FastAPI + SQLAlchemy persistence.

### 3.2 Theoretical Framework
- **Event-Driven Communication Model:** Each session authenticated with JWT and mapped to user identity.
- **WebRTC Signaling Model:** Offer-answer flow (SDP/ICE) managed through Socket.IO.
- **Authentication/Password Security:** Stored Password = bcrypt(sha256(password)).

### 3.3 Tools and Technologies
Backend: FastAPI, python-socketio, SQLAlchemy.
Frontend: Next.js, React, TypeScript, Zustand, Tailwind.
Communication: Socket.IO, WebRTC.

### 3.4 Architecture Model
The dual-channel model (REST API + Socket.IO) balances responsiveness with operational reliability.

---

# CHAPTER 4: WORK PLAN AND TASK ALLOCATION

### 4.1 Project Timeline
Five sprints over ten weeks:
- **Sprint 1 (Weeks 1-2):** Requirement analysis and environment setup.
- **Sprint 2 (Weeks 3-4):** Backend setup, authentication, and database schema.
- **Sprint 3 (Weeks 5-6):** Core messaging engine and group chat.
- **Sprint 4 (Weeks 7-8):** WebRTC integration and file uploads.
- **Sprint 5 (Weeks 9-10):** UI refinement, testing, and deployment.

### 4.2 Task Allocation
- **Marvin M Varghese:** Backend Lead and Overall Architecture.
- **Muhammed Sajid:** Frontend Lead.
- **Parthan S:** Database and Security Lead.
- **Azeem N:** Testing and Documentation.

### 4.3 Collaboration Tools
GitHub (Versioning), Slack/Discord (Communication), Postman (API Testing), LaTeX (Reporting), GitHub Issues (Task Management).

---

# CHAPTER 5: EXPERIMENTAL DESIGN / CODING / BLOCK DIAGRAM

### 5.1 Experimental Setup
Local development environment with desktop and mobile browser clients.

### 5.2 Coding Details
- **Backend:** Socket.IO server handling `send_message`, `typing_start`, etc.
- **Frontend:** Optimistic rendering for immediate UI feedback.

### 5.3 Block Diagram and Process Flow
The system runtime includes interaction between UI, API layer, real-time transport, and persistence layer. WebRTC flow handles signaling for media calls.

### 5.4 Testing and Validation
All modules (Authentication, Messaging, Attachments, UX, Calling) tested and verified (Pass).

### 5.5 Functional Test Cases
TC1-TC5 verified user flow from signup to call termination.

---

# CHAPTER 6: RESULTS AND CONCLUSION

### 6.1 Results
Consistent responsiveness and 100% delivery rate over stable Wi-Fi.

### 6.2 Analysis
- Performance: Suitable for up to 50 concurrent users per node.
- Latency (RTT): Localhost (<10-50ms), Wi-Fi (<40-120ms), Public Internet (<180-450ms).
- Deployment Cost: Approximately Rs. 817/month for a production VPS.

### 6.3 Conclusion
The project successfully meets all objectives by leveraging asynchronous libraries for a secure, responsive, and easy-to-host messaging platform.

### 6.4 Limitations
Single-node hosting (horizontal scaling needed), WebRTC NAT dependency (TURN server needed), and lacks E2EE.

---

# CHAPTER 7: FUTURE SCOPE

### 7.1 Potential Improvements
- **Redis Scalability:** Multi-node support for Socket.IO.
- **End-to-End Encryption (E2EE):** Signal Protocol integration.
- **TURN Server Integration:** For strict firewall/NAT environments.

### 7.2 Applications
Educational institutions, small businesses, and privacy-conscious individuals.

---

## RESEARCH OUTCOME
- Software Prototype: Completed.
- Technical Documentation: Completed.
- Deployment Artifacts: Completed.

---

## REFERENCES
1. FastAPI Documentation (2026).
2. Socket.IO Team (v4) Documentation (2026).
3. IETF RFC 6455 (WebSocket Protocol).
4. IETF RFC 8825 (WebRTC Overview).
5. Next.js Documentation (2026).
6. SQLAlchemy Documentation (v2.0).
7. OWASP Password Storage Cheat Sheet.
8. W3C WebRTC API Recommendation.

---

## APPENDICES

**Appendix A: Key API Endpoints**
`/auth/signup`, `/auth/login`, `/auth/forgot-password`, `/chat/contacts`, `/chat/history/{id}`, `/chat/upload`, `/profile/me`.

**Appendix B: Database Entities**
User, Contact, Group, GroupMember, Message, OTP, CallHistory.

**Appendix C: Directory Structure**
`backend/`, `frontend/`, `client/`, `migrations/`, `report/`, deployment configs.

**Appendix D: Socket Events**
`send_message`, `new_message`, `message_sent`, `typing_start`, `call_offer`, `call_answer`, `call_ice_candidate`.

---

## LIST OF PUBLICATIONS
No publications produced at the time of report submission.

# Invoice Management System

Invoice Management System is a full-stack web application for managing clients, invoices, PDF exports, user accounts, and a secure client portal. The backend is built with Spring Boot and PostgreSQL, and the frontend is built with Angular.

## Features

- Public landing page that explains the product and links to authentication
- User registration, login, JWT authentication, and password reset by email
- Dashboard for invoice and client activity
- Client management with create, edit, delete, and invoice history
- Invoice management with create, edit, view, filtering, status tracking, and PDF downloads
- Client portal with invitation-code activation
- Stable client access codes with manual copy, regeneration, and email sending
- Client portal login with separate client JWT tokens
- Client invoice viewing and PDF downloads
- Client profile editing for safe fields only: name, phone number, and address
- User-controlled client portal blocking and unblocking
- User account settings for profile details and password changes

## Tech Stack

- Backend: Java, Spring Boot, Spring Security, Spring Data JPA
- Database: PostgreSQL
- Frontend: Angular, TypeScript, Tailwind CSS, Font Awesome
- Authentication: JWT
- Email: Spring Mail SMTP
- PDF generation: backend PDF generation service

## Project Structure

```text
backend/
  src/main/java/com/invoice_management_system/
    config/
    controller/
    dto/
    model/
    repository/
    security/
    service/
frontend/
  src/app/
    components/
    guards/
    interceptors/
    services/
```

## Backend Setup

From the backend folder:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend expects PostgreSQL to be running with a database named:

```text
invoice_management_system
```

Default local database values can be overridden with environment variables:

```text
DB_USERNAME
DB_PASSWORD
JWT_SECRET
APP_FRONTEND_URL
```

## Email Configuration

Email credentials are intentionally not committed. Configure them with environment variables before running the backend:

```text
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

For Gmail, use an app password with 2-Step Verification enabled.

## Frontend Setup

From the frontend folder:

```powershell
cd frontend
npm install
npm.cmd start
```

The Angular app runs on:

```text
http://localhost:4200
```

## Main Routes

- `/` - public landing page
- `/auth` - user and client authentication
- `/dashboard` - user dashboard
- `/clients` - user client management
- `/invoices` - user invoice management
- `/client-portal` - client self-service portal

## Client Portal Flow

1. A logged-in user creates a client.
2. The user generates an access code for that client.
3. The code can be copied manually or sent by email.
4. The client opens `/auth`, chooses Client, and activates with email, invitation code, and password.
5. The client logs in and views only their own portal data.
6. The user can block or unblock the client portal account at any time.

## Account Management

Users can open Account Settings from the user portal dropdown to update profile details and change their password. Username is kept read-only because the current JWT identity is based on username.

Clients can update only safe profile fields in the client portal: name, phone number, and address. Email and invoice data remain controlled by the user.

## Verification Commands

Backend compile:

```powershell
cd backend
.\mvnw.cmd -q -DskipTests compile
```

Frontend build:

```powershell
cd frontend
npm.cmd run build
```

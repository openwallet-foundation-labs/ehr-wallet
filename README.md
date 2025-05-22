# GlobalRad RIS

## Project Overview

GlobalRad RIS (Radiology Information System) is a comprehensive medical imaging management solution designed to streamline radiology workflows, patient record management, and imaging scheduling for healthcare providers.

## Features

- **Patient Management**: Complete patient registration, viewing, and editing capabilities with an intuitive interface
- **Advanced Filtering**: Filter patients by Last Visit date or Date of Birth with a user-friendly calendar interface
- **Appointment Scheduling**: Comprehensive scheduling system with provider management, appointment types, and time slots
- **User Authentication**: Secure login and registration system with role-based access control
- **Responsive Design**: Modern UI that works across devices with a focus on usability

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd globalrad-ris

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Access the Application

After starting the development server, you can access the application at:

```
http://localhost:3000
```

## Tech Stack

This project is built with:

- **Next.js**: React framework for production-grade applications
- **TypeScript**: For type safety and better developer experience
- **Prisma**: ORM for database access
- **SQLite**: Lightweight database for development
- **shadcn/ui**: Component library
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication solution

## Project Structure

- `/pages`: Next.js pages and API routes
- `/components`: Reusable React components
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/styles`: Global CSS and Tailwind configuration
- `/lib`: Utility functions and shared code

## Database Models

The application includes several key models:
- Users and authentication
- Patients and medical records
- Providers and staff
- Appointment types
- Time slots
- Appointments

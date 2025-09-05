# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Groove is a browser-based music production tool designed to make music creation accessible. The app
features AI integration, collaborative features and a sound library to help users create music more
easily.

## Development Commands

- `pnpm dev` - Start development server (Vite)
- `pnpm build` - Build for production (TypeScript compile + Vite build)
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build locally
- `pnpm deploy` - Build and deploy to Firebase hosting

## Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, React Router v7
- **Styling**: Hand-rolled CSS, CSS modules, variables, all the shiny new CSS features
- **Build Tool**: Vite
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Package Manager**: pnpm

### Project Structure

- `src/App.tsx` - Main app component with routing
- `src/pages/` - Page components (HomePage, DashboardPage, ProjectPage)
- `src/components/` - Reusable components (ProtectedRoute)
- `src/firebaseConfig.ts` - Firebase initialization and exports
- `src/types.ts` - TypeScript type definitions

### Authentication & Data

- Firebase Authentication for user management
- Firestore for data persistence
- Protected routes require authentication
- Project data includes metadata like tempo, ownership, and visibility settings

### Environment Variables

Firebase configuration is loaded from environment variables prefixed with `VITE_FIREBASE_*`. These should be defined in `.env` file.

### Build Configuration

- TypeScript with strict configuration
- ESLint with React and TypeScript rules
- Source maps enabled in production builds
- Firebase hosting with SPA routing support

## Coding Conventions

- Use TypeScript for type safety
- Follow React best practices (functional components, hooks)
- Use CSS modules for component-specific styles
- Avoid trailing whitespace
- Prefer " to ' for strings

# Forex CRM - Developer Documentation

## Overview
Vue 3 CRM application with authentication, user management, and profile features.

## Tech Stack
- **Framework**: Vue 3 (Composition API)
- **State Management**: Vuex
- **Routing**: Vue Router
- **UI**: Argon Dashboard
- **API**: RESTful with Bearer token authentication

## Key Features Implemented

### 1. Authentication System
- **Login/Signup**: Handles JSON response structure `{success, message, data: {user, token, api_key}}`
- **Token Management**: Stores token, user data, and API key in Vuex + localStorage
- **Route Guards**: Protected routes require authentication; redirects to `/signin` if not logged in
- **Auto-login**: After signup, automatically logs user in and redirects to dashboard

**Files**: `src/views/Signin.vue`, `src/views/Signup.vue`, `src/store/index.js`, `src/router/index.js`

### 2. API Utilities
- **Location**: `src/utils/api.js`
- **Functions**: `apiCall()`, `apiGet()`, `apiPost()`, `apiPut()`, `apiPatch()`, `apiDelete()`
- **Features**:
  - Automatically adds Bearer token to all requests
  - Handles 401 responses (auto-logout and redirect)
  - Base URL from `APP_CONFIG.baseApiUrl`

**Usage**:
```javascript
import { apiPost } from '@/utils/api.js';
const response = await apiPost('/client/change-password', {
  current_password: '...',
  new_password: '...',
  new_password_confirmation: '...'
});
```

### 3. User Profile
- **Display**: Shows all user data from signin/signup response in table format
- **Change Password**: Form with API integration (`/client/change-password`)
- **Data Source**: Vuex store (`store.getters.currentUser`)

**File**: `src/views/Profile.vue`

### 4. Navigation Bar
- **User Dropdown**: Shows user name with profile/logout options
- **Logout**: Calls `/client/logout` API with Bearer token
- **Removed**: Search bar (as per requirements)

**File**: `src/examples/Navbars/Navbar.vue`

### 5. Store Structure
```javascript
state: {
  isAuthenticated: boolean,
  token: string,
  user: object,
  apiKey: string
}
```

**Getters**: `isAuthenticated`, `currentUser`, `authToken`, `apiKey`
**Actions**: `login({token, user, apiKey})`, `logout()`, `initializeAuth()`

## API Endpoints Used

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/client/login` | POST | No | User login |
| `/client/signup` | POST | No | User registration |
| `/client/logout` | POST | Yes | User logout |
| `/client/change-password` | POST | Yes | Change password |

**Base URL**: `http://127.0.0.1:8000/api` (configurable in `src/Data/appConfig.js`)

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "user": {...},
    "token": "string",
    "api_key": "string" // Only in signup
  }
}
```

## Route Protection
- **Protected Routes**: Dashboard, Tables, Billing, Profile, Virtual Reality
- **Public Routes**: Signin, Signup
- **Guard Logic**: Checks `store.getters.isAuthenticated` before navigation

## Code Structure
```
src/
├── store/index.js          # Vuex store with auth state
├── router/index.js          # Routes with navigation guards
├── utils/api.js             # API utility functions
├── views/
│   ├── Signin.vue          # Login page
│   ├── Signup.vue          # Registration page
│   └── Profile.vue         # User profile page
└── examples/
    └── Navbars/
        └── Navbar.vue      # Main navigation with user menu
```

## Removed Features
- **RTL Support**: All RTL functionality removed (Arabic text, RTL routes, conditional logic)
- **RTL Route**: `/rtl-page` removed from router

## Environment Setup
1. Install dependencies: `npm install`
2. Configure API URL in `src/Data/appConfig.js`
3. Run dev server: `npm run serve`
4. Build for production: `npm run build`

## Important Notes
- All API calls (except login/signup) require Bearer token in Authorization header
- Token is automatically added by `api.js` utilities
- User data persists in localStorage across page refreshes
- 401 responses trigger automatic logout and redirect to signin



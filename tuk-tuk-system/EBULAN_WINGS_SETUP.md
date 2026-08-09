# Ebulan Wings - Admin Setup & Slogans

## 🦁 Slogan Recommendations

### Top Choice:
**"Soar Above the City"** 
- Short, memorable, aspirational
- Ties to the "Wings" brand perfectly
- Suggests elevation and freedom

### Alternatives:
- "Your Wings to Anywhere" (Personal, accessible)
- "Ride with Royalty" (Premium, Ethiopian heritage)
- "Swift. Secure. Sovereign." (SSI/DID emphasis, alliterative)

## 🎨 Font Recommendations

### Title Font (Logo):
- **Cinzel** - Roman imperial elegance (RECOMMENDED)
- **Trajan Pro** - Ancient authority, powerful
- **Playfair Display** - Royal sophistication

### Slogan Font:
- **Montserrat** - Modern, clean, pairs well with Cinzel
- **Lato** - Professional, readable

## 🔐 Admin Login System

### Default Credentials:
```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change in production!

### Setup Status:
✅ Database schema updated with `username` field
✅ Admin authentication controller created
✅ Admin login routes added
⏳ Need to rebuild and restart services

### Next Steps:
1. Rebuild auth-service with fixed TypeScript issues
2. Insert default admin user
3. Test admin login at http://localhost:3200/login


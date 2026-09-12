const fs = require('fs');

// Navbar.tsx
let nav = fs.readFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/Navbar.tsx', 'utf8');
nav = nav.replace('text-xl font-bold tracking-tight', 'text-2xl font-bold tracking-tight');
fs.writeFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/Navbar.tsx', nav);

// DashboardNav.tsx
let dash = fs.readFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/DashboardNav.tsx', 'utf8');
// desktop (line ~68) - it currently has "text-base font-bold text-navy-900"
dash = dash.replace('text-base font-bold text-navy-900 sm:block tracking-tight', 'text-xl font-bold text-navy-900 sm:block tracking-tight');
// mobile (line ~213) - currently has "text-base font-bold text-navy-900"
dash = dash.replace('<span className="text-base font-bold text-navy-900"><span>Tutor', '<span className="text-xl font-bold text-navy-900 tracking-tight"><span>Tutor');
fs.writeFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/DashboardNav.tsx', dash);

// Footer.tsx
let foot = fs.readFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/Footer.tsx', 'utf8');
// it has "text-xl font-bold tracking-tight text-navy-900" or similar
foot = foot.replace('text-xl font-bold tracking-tight text-navy-900', 'text-2xl font-bold tracking-tight text-navy-900');
fs.writeFileSync('/Users/avinashsingh/Desktop/Tutormeet/components/layout/Footer.tsx', foot);

// Auth pages (LoginForm, RegisterForm) - they still have the old logo wordmark logic or maybe not. Oh, auth forms just have {APP_NAME} in text, not a logo wrapper! Actually LoginForm has `<h1 className="text-xl font-bold ...">Welcome back</h1>` 

console.log("Sizes patched");

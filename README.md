PHASE 1
│
├── /assets                   <-- [SHARED] everyone uses for images if needed
├── /css
│     ├── admin.css           <-- [Abigail] Sidebar layout & dashboard tables
│     ├── auth.css            <-- [Gab] Centered login/register card styles
│     ├── common.css          <-- [SHARED] GLOBAL STYLES (Navbar, Footer, Fonts)
│     ├── home.css           <-- [Bea] Hero banner & search bar styles
│     ├── profile.css         <-- [Renzel] User info card & history list
│     └── view-lab.css        <-- [Renzel] Grid layout (Red/Green seats)
│
├── /js
│     ├── admin.js            <-- [Abigail] Logic to view all & delete any reservation
│     ├── auth.js             <-- [Gab] Form validation & user creation logic
│     ├── data.js             <-- [Gab, Renzel] MOCK DATABASE (Arrays for Users/Labs)
│     ├── profile.js          <-- [Renzel] Logic to render personal history & delete
│     ├── home.js           <-- [Bea] Home page logic (Render Labs + Search)
│     └── view-lab.js         <-- [Renzel] Seat generation & selection logic
│
├── admin-dashboard.html      <-- [Abigail] Technician View
├── index.html                <-- [Bea] Home Page
├── login.html                <-- [Gab] Sign-in Form
├── profile.html              <-- [Renzel] User Dashboard
├── register.html             <-- [Gab] Sign-up Form
├── view-lab.html             <-- [Renzel] Seat Selection Interface
└── README.md

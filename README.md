PHASE 2 SETUP INSTRUCTIONS
--------------------------

---









CCAPDEV-Phase2-Group7/
 	📂 model/                     # REQUIRED: All database schemas go here
		db.js                     # Mongoose connection setup
	        User.js                   # Mongoose Schema for Users
                Reservation.js            # Mongoose Schema for Bookings
                Lab.js                    # Mongoose Schema for Labs
                Building.js               # Mongoose Schema for Buildings
		Seed-data.js              # Raw JSON arrays for your 5 sample data entries
      

    📂 src/                       # The core Express backend application
                app.js                    # Express app configuration (Handlebars, Static files)
 	 📂 controllers/           # The "Brains" (Logic & Database Queries)
		authController.js     # Handles Login/Register logic
	 	userController.js     # Handles Profile & Walk-in queries
		reservationController.js # Handles multi-slot booking logic & cancellations
		 labController.js      # Handles seat map availability queries
		 buildingController.js

    📂 routes/                # The "Traffic Cops" (Directs URLs to Controllers)
		viewRoutes.js         # Renders the .hbs pages (e.g., GET / -> index.hbs)
		 📂 api/               # API endpoints for data fetching
			index.js          # Combines all API routes
			 authRoutes.js
			userRoutes.js
			reservationRoutes.js
			labRoutes.js
		        buildingRoutes.js

    📂 middleware/            # Security & Error Handling (Bonus/Best Practice)
		 asyncHandler.js       # Prevents the app from crashing on DB errors
		validateRequest.js    # Form validation (Optional for this phase)

    📂 views/                     # REQUIRED: Handlebars Template Engine
		📂 pages/                 # The main web pages
			 index.hbs
			 login.hbs
			register.hbs
			 profile.hbs
			view-lab.hbs
			admin-dashboard.hbs
			 error.hbs             # Fallback page for broken links

    📂 partials/              # Reusable UI components
			head.hbs              #`<head>` metadata and CSS links
			scripts.hbs           # Global JS imports
			topNavbar.hbs         # Standardized Top Navigation
			adminSidebar.hbs      # Standardized Technician Sidebar

    📂 public/                    # Static Frontend Files (Moved from Phase 1)
		📂 css/                   # common.css, auth.css, etc.
		📂 js/                    # DOM manipulation (fetching from API instead of data.js)
		 📂 assets/                # Images, icons, backgrounds
📂 scripts/
	seed.js                   # Script to push seed-data.js into MongoDB automatically
.env.example                  # Template for MongoDB connection string
.gitignore                    # Hides node_modules and .env from GitHub
package.json                  # Contains your npm dependencies and start scripts
README.md                     # REQUIRED: Instructions to run the appserver.js                     # The entry point that boots up localhost:3000

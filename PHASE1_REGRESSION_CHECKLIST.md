# ArcherLabs Phase 1 Manual Regression Checklist

## 1. Visitor Mode
- Open `index.html` with no active session.
- Confirm navbar shows `Home`, `Reserve a Lab`, `Login` only.
- Go to `view-lab.html`; confirm map/availability can be viewed.
- Click `Reserve`; confirm alert prompts login and redirects to `login.html`.
- Click a non-anonymous occupied seat username; confirm `profile.html?user=<username>` opens in read-only mode.

## 2. Student Mode
- Log in as a Student account.
- Confirm top navbar appears; sidebar is hidden.
- Reserve 2+ time slots in one action and confirm success modal appears.
- Refresh page; confirm reservation still exists.
- Open `profile.html`; confirm reservation history, requested/reserved timestamps, edit, and cancel actions work.
- Edit reservation to multiple slots; refresh and confirm changes persist.
- Delete/cancel reservation; refresh and confirm it stays deleted.

## 3. Technician Mode
- Log in as Lab Technician.
- Confirm top navbar is hidden and left sidebar is visible on all pages.
- In sidebar, click `Dashboard`, `Reservations`, and `Laboratories`; confirm active highlight changes correctly.
- Go to `view-lab.html`; confirm walk-in target input is required.
- Enter a registered student identifier; reserve and confirm stored name is marked `(walk-in)`.
- Enter a custom non-account name; reserve and confirm it is accepted as walk-in.

## 4. Technician No-Show Enforcement
- In `admin-dashboard.html`, verify Active Reservations table is data-driven (not hardcoded).
- Attempt to remove a reservation before start+10 minutes; confirm removal is blocked with eligible time message.
- After eligibility (or with seeded eligible data), remove reservation; confirm whole group is removed and persists after refresh.

## 5. Cross-Tab Sync
- Open two tabs to `view-lab.html` for the same lab/date.
- In tab A, create/cancel a reservation.
- Confirm tab B seat availability updates on interval or storage-triggered refresh without manual reload.

## 6. Auth and Session
- Test login with Remember Me checked; close/reopen tab and confirm session restoration.
- Logout via top navbar and via sidebar logout; confirm session is cleared and user is redirected to `login.html`.

## 7. Responsive Smoke
- Check `login.html` and `register.html` on narrow viewport (mobile width).
- Confirm form card and input placeholders render fully without clipping.

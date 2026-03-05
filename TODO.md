# TODO: Add User Approval Feature

## Backend Changes
- [x] 1. Update User model - add isApproved, approvedBy, approvedAt fields
- [x] 2. Update auth routes - modify register to set isApproved false
- [x] 3. Update auth routes - modify login to check approval
- [x] 4. Add approve/reject/activate routes

## Frontend Changes
- [x] 5. Update Users page - show approval status
- [x] 6. Update Users page - add approve/reject buttons
- [x] 7. Add toast notifications for actions

## Testing
- [x] 8. Test registration flow
- [x] 9. Test login with unapproved user
- [x] 10. Test admin approval flow


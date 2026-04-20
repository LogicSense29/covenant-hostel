# Phone Number and Email Validation

## Overview
Added automatic phone number formatting with +234 prefix and email validation to registration and inspection booking forms.

## Phone Number Validation

### Features:
1. **Automatic +234 Prefix**: All phone numbers are automatically prefixed with +234 (Nigeria country code)
2. **User-Friendly Input**: Users only need to enter the 10-digit phone number (e.g., 7061608636)
3. **Visual Indicator**: The +234 prefix is displayed in the input field but users don't type it
4. **Digit-Only Input**: Automatically strips non-numeric characters
5. **Length Validation**: Limits input to exactly 10 digits
6. **Format Validation**: Validates that the final format is +2341234567890

### Implementation:

#### Registration Form (`src/app/register/page.js`):
- **Tenant Phone**: Main phone number field with +234 prefix
- **Guarantor Phone**: Guarantor's phone number with +234 prefix
- Both fields validate on form submission

#### Inspection Booking Form (`src/components/BookInspectionForm.js`):
- Phone number field with +234 prefix
- Optional field (not required for booking)
- Validates if provided

### User Experience:
```
User types: 7061608636
System stores: +2347061608636
Display shows: +234 | 7061608636
```

### Validation Rules:
- Must be exactly 10 digits after +234
- No letters or special characters allowed
- Format: `+234XXXXXXXXXX` where X is a digit

## Email Validation

### Features:
1. **Real-Time Validation**: Shows error message as user types invalid email
2. **Standard Email Format**: Validates using regex pattern
3. **Visual Feedback**: Red error message appears below invalid email
4. **Form Submission Block**: Prevents form submission with invalid email

### Implementation:

#### Validation Function:
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

#### Applied To:
- Registration form email field
- Inspection booking form email field

### User Experience:
- User types email
- If invalid format, red error message appears: "Please enter a valid email address"
- Form cannot be submitted until email is valid
- Error disappears when valid email is entered

### Validation Rules:
- Must contain @ symbol
- Must have characters before @
- Must have domain after @
- Must have extension after domain (e.g., .com, .ng)
- No spaces allowed

## Error Messages

### Phone Number Errors:
- "Please enter a valid 10-digit phone number"
- "Please enter a valid 10-digit guarantor phone number"

### Email Errors:
- "Please enter a valid email address"

## Files Modified:

1. **src/app/register/page.js**
   - Added `validateEmail()` function
   - Added `validatePhone()` function
   - Updated `handleChange()` to format phone numbers with +234
   - Updated phone input fields with +234 prefix display
   - Updated guarantor phone input with +234 prefix display
   - Added email validation with visual feedback
   - Added validation checks in `nextStep()` function

2. **src/components/BookInspectionForm.js**
   - Added `validateEmail()` function
   - Added `validatePhone()` function
   - Added `handlePhoneChange()` function for phone formatting
   - Updated phone input field with +234 prefix display
   - Added email validation with visual feedback
   - Added validation checks in `handleSubmit()` function

## Testing Checklist:

- [x] Phone number automatically adds +234 prefix
- [x] Phone number accepts only 10 digits
- [x] Phone number strips non-numeric characters
- [x] Guarantor phone number has same validation
- [x] Email validation shows error for invalid format
- [x] Email validation accepts valid email formats
- [x] Form submission blocked with invalid email
- [x] Form submission blocked with invalid phone
- [x] Inspection booking phone validation works
- [x] Inspection booking email validation works

## Examples:

### Valid Phone Numbers:
- User enters: `7061608636` → Stored as: `+2347061608636` ✅
- User enters: `8012345678` → Stored as: `+2348012345678` ✅
- User enters: `9087654321` → Stored as: `+2349087654321` ✅

### Invalid Phone Numbers:
- User enters: `706160863` (9 digits) → Error ❌
- User enters: `70616086366` (11 digits) → Truncated to 10 ❌
- User enters: `abc1234567` → Only digits extracted ❌

### Valid Emails:
- `user@example.com` ✅
- `john.doe@company.ng` ✅
- `admin@hostel.co.uk` ✅

### Invalid Emails:
- `userexample.com` (no @) ❌
- `user@` (no domain) ❌
- `@example.com` (no username) ❌
- `user @example.com` (space) ❌

## Benefits:

1. **Consistency**: All phone numbers stored in same format (+234XXXXXXXXXX)
2. **User-Friendly**: Users don't need to remember country code
3. **Data Quality**: Ensures valid phone numbers and emails in database
4. **Error Prevention**: Catches invalid data before submission
5. **International Standard**: Uses E.164 phone number format
6. **Better UX**: Clear visual feedback for validation errors

## Database Storage:

Phone numbers are stored in the database with the +234 prefix:
- `TenantProfile.phone`: `+2347061608636`
- `TenantProfile.guarantorPhone`: `+2348012345678`
- `GuestInspection.phone`: `+2349087654321`

This ensures consistency across the entire application and makes it easy to integrate with SMS/WhatsApp services in the future.

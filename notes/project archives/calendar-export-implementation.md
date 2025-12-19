# Calendar Export Implementation Spec

## Overview

Add "Add to Calendar" functionality to Squad pages with user preference storage.

## Goals

- Let users export plans to their calendar app of choice
- Remember preference after first selection
- Smart button: dropdown first time, direct button after
- Support Google Calendar (URL), Apple Calendar (.ics), Outlook (.ics)

## User Flow

### First Time Use
1. User clicks "Add to Calendar" button (dropdown indicator visible)
2. Dropdown shows 3 options: Google Calendar, Apple Calendar, Outlook
3. User selects preference
4. Calendar opens/downloads
5. Preference saved to User profile
6. Toast confirmation: "Calendar event downloaded!" or "Opening Google Calendar..."

### Subsequent Uses
1. Button shows: "Add to Google Calendar" (direct action, no dropdown by default)
2. Click → Opens Google Calendar immediately
3. Small ▾ on right side lets them change preference if needed

## Technical Implementation

### 1. Database Schema

**File:** `prisma/schema.prisma`

```prisma
model User {
  // ... existing fields
  calendarPreference String? // 'GOOGLE' | 'APPLE' | 'OUTLOOK'
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_calendar_preference
```

### 2. Calendar Utilities

**File:** `src/lib/calendar.ts`

**Functions to create:**
- `generateICS(squad: Squad): string` - Generate iCalendar (.ics) file content
- `generateGoogleCalendarURL(squad: Squad): string` - Build Google Calendar URL
- `downloadICS(content: string, filename: string): void` - Trigger browser download
- `exportToCalendar(squad: Squad, type: CalendarType): void` - Main export function

**ICS Format includes:**
- Event title (displayTitle)
- Start date/time
- Venue as location
- Description: "Plan with [member names]"
- Itinerary/stops in description (if available)
- Link back to squad page

**Google Calendar URL format:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=[Event Title]
  &dates=[Start]/[End]
  &details=[Description]
  &location=[Venue]
```

### 3. API Endpoint

**File:** `src/app/api/users/me/calendar-preference/route.ts`

**Endpoint:** `PATCH /api/users/me/calendar-preference`

**Request body:**
```json
{
  "preference": "GOOGLE" | "APPLE" | "OUTLOOK"
}
```

**Response:**
```json
{
  "success": true
}
```

**Logic:**
- Get current user from auth
- Update user.calendarPreference
- Return success

### 4. CalendarDropdown Component

**File:** `src/components/CalendarDropdown.tsx`

**Props:**
```typescript
interface CalendarDropdownProps {
  squad: Squad;
  currentPreference?: string | null;
  className?: string;
}
```

**State:**
- `isOpen: boolean` - Dropdown visibility
- `exporting: boolean` - Loading state during export

**Behavior:**
- **No preference:** Show "Add to Calendar ▾" with dropdown menu
- **Has preference:** Show "Add to [Type] Calendar" with optional ▾ on right
- On selection:
  1. Call `exportToCalendar(squad, type)`
  2. Save preference via API
  3. Update local state
  4. Show toast confirmation

**UI:**
- Dropdown menu: rounded-xl, shadow-lg, border
- Options: Icon + text for each calendar type
- Match brand styling (green accents, rounded corners)

### 5. Squad Page Changes

**Files to modify:**
- `src/components/squad/PlanModeView.tsx`
- `src/components/squad/SquadPage.tsx`

**Layout changes:**

**Add new section after event header:**
```tsx
{/* Quick Actions - Top */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
  <div className="flex gap-2">
    <Button
      variant="primary"
      size="sm"
      onClick={onSharePlan}
      disabled={copying === 'plan'}
      className="flex-1"
    >
      {copying === 'plan' ? '✓ Copied!' : 'Share Plan'}
    </Button>
    <CalendarDropdown
      squad={squad}
      currentPreference={calendarPreference}
      className="flex-1"
    />
  </div>
</div>
```

**Keep existing bottom section:**
```tsx
{/* Share Options - Bottom (will clean up later) */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
  <div className="flex gap-2">
    <Button variant="primary" size="sm" onClick={onSharePlan}>
      Share Plan
    </Button>
    <Button variant="secondary" size="sm" onClick={onShareDayOf}>
      Share Day-of
    </Button>
  </div>
</div>
```

**Pass calendarPreference to PlanModeView:**
- Fetch from currentUser in SquadPage
- Pass as prop to PlanModeView

### 6. Toast Messages

**On export:**
- Google Calendar: "Opening Google Calendar..."
- Apple/Outlook: "Calendar event downloaded!"

**On preference saved:**
- No separate toast (handled by export toast)

## Calendar Type Details

### Google Calendar
- **Method:** URL redirect
- **Pros:** Opens in browser/app seamlessly on all platforms
- **Best for:** Android users, anyone with Google Calendar

### Apple Calendar (.ics)
- **Method:** File download
- **Pros:** iOS auto-detects and prompts to add
- **Best for:** iOS users, desktop Mac users

### Outlook (.ics)
- **Method:** File download
- **Pros:** Universal format, works with Outlook.com and desktop
- **Best for:** Windows/Office users

## Testing Checklist

- [ ] Schema migration runs successfully
- [ ] API endpoint saves preference correctly
- [ ] Google Calendar URL opens correctly
- [ ] Apple Calendar .ics downloads
- [ ] Outlook .ics downloads
- [ ] iOS prompts to add to Calendar app
- [ ] Android opens Google Calendar correctly
- [ ] Desktop downloads .ics file
- [ ] Preference persists on next visit
- [ ] Dropdown → direct button transition works
- [ ] Can change preference via ▾ dropdown
- [ ] Toast shows appropriate message
- [ ] Buttons fit on mobile (don't overflow)
- [ ] Share Plan button still works

## File Structure

```
New files:
- src/lib/calendar.ts
- src/components/CalendarDropdown.tsx
- src/app/api/users/me/calendar-preference/route.ts

Modified files:
- prisma/schema.prisma
- src/components/squad/SquadPage.tsx
- src/components/squad/PlanModeView.tsx

New migration:
- prisma/migrations/[timestamp]_add_calendar_preference/migration.sql
```

## Notes

- Keep both button rows for now (top + bottom share buttons)
- Will dedupe/simplify in future cleanup pass
- Preference is per-user, stored in database (not localStorage)
- Calendar dropdown reuses existing Button component variants
- Toast feedback uses existing ToastContext

---

**Status:** Ready to implement  
**Estimated effort:** ~2 hours  
**Dependencies:** None (all infrastructure exists)


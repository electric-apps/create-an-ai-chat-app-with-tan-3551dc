# QA Test Plan

Generated: 2026-04-15
Based on: PLAN.md (AI Chat App with TanStack AI + Durable Transports)

## Summary

Last run: 2026-04-15 — **13/15 passed, 2 failed**

| # | Test | Result |
|---|------|--------|
| T1 | Smoke — App loads | ✅ PASS |
| T2 | Smoke — No JS console errors | ❌ FAIL |
| T3 | Settings — Gear icon opens dialog | ✅ PASS |
| T4 | Settings — API key saved to localStorage | ✅ PASS |
| T5 | Settings — Model selector shows all Claude options | ✅ PASS |
| T6 | New Chat — Creates a new conversation | ✅ PASS |
| T7 | Chat — Empty state shows prompt text | ✅ PASS |
| T8 | Chat — Message input disabled without API key | ✅ PASS |
| T9 | Sidebar — Conversation list renders | ✅ PASS |
| T10 | Sidebar — Delete shows confirmation dialog | ❌ FAIL |
| T11 | Navigation — Clicking conversation navigates to chat route | ✅ PASS |
| T12 | Home — Welcome screen when no conversations | ✅ PASS |
| T13 | Mobile — Sidebar collapses on small viewport | ✅ PASS |
| T14 | Settings — Cancel discards changes | ✅ PASS |
| T15 | API key — Show/hide toggle works | ✅ PASS |

---

## Test Cases

### T1: Smoke — App loads without errors
**Steps:**
1. Navigate to http://localhost:5180
2. Verify main page renders (no error boundary, no blank white screen)
3. Check that the page contains recognizable UI elements (header, sidebar or welcome screen)

**Expected:** Page loads, no crash, visible UI

**Last run:** 2026-04-15 ✅ PASS — Page loads with header "Claude Chat", sidebar, and chat area

---

### T2: Smoke — No JS console errors on first paint
**Steps:**
1. Navigate to http://localhost:5180
2. Check browser console for JS errors

**Expected:** No uncaught errors in the console

**Last run:** 2026-04-15 ❌ FAIL — 2 errors on load:
- `Failed to load resource: 404 Not Found` at `/api/ds-stream/chat/<uuid>?offset=-1&live=sse`
- Same error repeated (two concurrent stream requests fail)

**Root cause:** The durable stream proxy route `/api/ds-stream` returns 404. The app tries to subscribe to the existing conversation's durable stream immediately on load, but the proxy endpoint is missing or misconfigured. This means message history will not load for existing conversations.

---

### T3: Settings — Gear icon opens settings dialog
**Steps:**
1. Navigate to http://localhost:5180
2. Click the gear/settings icon in the header
3. Verify a settings dialog appears

**Expected:** Settings dialog opens with API key input and model selector

**Last run:** 2026-04-15 ✅ PASS — Dialog opens with "Anthropic API Key" masked input (show/hide eye toggle), "Model" combobox, Cancel and Save buttons

---

### T4: Settings — API key can be saved to localStorage
**Steps:**
1. Navigate to http://localhost:5180
2. Open settings dialog (click gear icon)
3. Type a test API key into the API key input
4. Select a model from the dropdown
5. Click "Save"
6. Verify dialog closes
7. Verify localStorage has "anthropic_api_key" set

**Expected:** Dialog closes, API key stored in localStorage

**Last run:** 2026-04-15 ✅ PASS — `localStorage.getItem('anthropic_api_key')` = `"sk-ant-test-key-qa-123"`, `localStorage.getItem('preferred_model')` = `"claude-sonnet-4-5"`

---

### T5: Settings — Model selector shows all Claude options
**Steps:**
1. Navigate to http://localhost:5180
2. Open settings dialog
3. Inspect the model dropdown options

**Expected:** Dropdown contains at least claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5

**Last run:** 2026-04-15 ✅ PASS — Dropdown shows: "Claude Sonnet 4.5" (selected ✓), "Claude Opus 4.5", "Claude Haiku 4.5"

---

### T6: New Chat — Creates a new conversation
**Steps:**
1. Navigate to http://localhost:5180
2. Ensure API key is set in settings
3. Click "New Chat" button
4. Verify a new conversation appears in the sidebar and chat view opens

**Expected:** New chat is created, empty chat view is shown

**Last run:** 2026-04-15 ✅ PASS — URL changed to new `/chat/<uuid>`, sidebar updated with new entry, empty chat state shown

---

### T7: Chat — Empty state shows prompt text
**Steps:**
1. Navigate to http://localhost:5180
2. Open or create a conversation
3. Look for the empty-state prompt text in the chat area

**Expected:** "Ask Claude anything…" or similar placeholder visible

**Last run:** 2026-04-15 ✅ PASS — "Ask Claude anything..." shown with bot icon in empty chat view

---

### T8: Chat — Message input is disabled without API key
**Steps:**
1. Navigate to http://localhost:5180 in a fresh session (no localStorage)
2. Create or open a conversation
3. Check if the message input is disabled or shows a warning

**Expected:** Input disabled or warning shown when API key not configured

**Last run:** 2026-04-15 ✅ PASS — Input shows placeholder "Set your API key in Settings to start chatting" when no key set; changes to "Type a message..." after key is saved

---

### T9: Sidebar — Conversation list shows existing conversations
**Steps:**
1. Navigate to http://localhost:5180
2. Check the left sidebar for a conversation list

**Expected:** Sidebar renders conversation list (or empty state if no conversations)

**Last run:** 2026-04-15 ✅ PASS — Sidebar renders conversations with title and relative timestamps ("now", "6m ago", etc.)

---

### T10: Sidebar — Delete conversation shows confirmation
**Steps:**
1. Navigate to http://localhost:5180
2. Create a new conversation if none exists
3. Click the trash/delete icon on a conversation
4. Verify a confirmation dialog appears

**Expected:** Confirmation dialog appears before deleting

**Last run:** 2026-04-15 ❌ FAIL — Clicking the delete button removes the conversation immediately with NO confirmation dialog. The conversation is instantly deleted and the sidebar updates. Per the spec (Flow 5): "User clicks trash → confirmation dialog. Confirmed → conversation record deleted."

---

### T11: Navigation — Clicking a conversation navigates to chat route
**Steps:**
1. Navigate to http://localhost:5180
2. Click on a conversation in the sidebar
3. Verify the URL changes to /chat/<id>
4. Verify the chat view loads

**Expected:** URL changes, chat view renders for selected conversation

**Last run:** 2026-04-15 ✅ PASS — Clicking sidebar item navigates to `/chat/0d7346e8-...`, chat view loads with empty state

---

### T12: Home — Welcome screen shown when no conversations
**Steps:**
1. Navigate to http://localhost:5180 with no conversations in the DB
2. Verify a welcome/CTA screen appears with a "New Chat" button

**Expected:** Welcome screen with "New Chat" CTA visible

**Last run:** 2026-04-15 ✅ PASS — "Welcome to Claude Chat" heading, "Start a new conversation with Claude." subtitle, and "+ New Chat" button shown

---

### T13: Mobile — Sidebar collapses on small viewport
**Steps:**
1. Navigate to http://localhost:5180
2. Resize browser to mobile width (375px)
3. Verify the sidebar is not visible by default
4. Look for a hamburger menu or drawer trigger

**Expected:** Sidebar hidden on mobile, menu trigger visible

**Last run:** 2026-04-15 ✅ PASS — Sidebar collapses at 375px, hamburger button appears at top-left; clicking it opens a slide-out drawer with conversation list

---

### T14: Settings — Cancel button closes dialog without saving
**Steps:**
1. Open settings dialog
2. Type a new value into the API key field
3. Click "Cancel"
4. Re-open settings dialog
5. Verify the original value is still shown

**Expected:** Changes discarded on Cancel

**Last run:** 2026-04-15 ✅ PASS — Typed "sk-test-cancel-check", clicked Cancel, re-opened dialog: field shows only placeholder "sk-ant-..." confirming value was not saved

---

### T15: API key — Show/hide toggle works in settings
**Steps:**
1. Open settings dialog
2. Verify the API key field is masked (password input)
3. Click the show/hide toggle
4. Verify the icon changes (eye → eye-off)

**Expected:** Toggle switches between masked and visible API key

**Last run:** 2026-04-15 ✅ PASS — Eye icon toggles to eye-off (strikethrough) on click, confirming show/hide functionality works

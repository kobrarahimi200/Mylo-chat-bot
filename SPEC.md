d# Mylo AI Chatbot — Open Specification

## 1. Overview
Mylo AI is a lightweight, browser-based conversational assistant built with Next.js. The product allows users to create chat conversations, manage chat history, organize conversations into folders, switch between languages, switch themes, and send messages to a chat backend endpoint.

This document defines the product behavior, functional requirements, and technical contract for the current implementation.

## 2. Product Goals
- Provide a simple chat experience for users to ask questions and receive responses.
- Persist conversation history locally in the browser.
- Support multiple conversations with easy organization.
- Keep the interface responsive on desktop and mobile screens.
- Allow users to switch between English and Persian layout/language experience.
- Support light/dark theme selection.

## 3. Non-Goals
- User authentication or multi-user accounts.
- Server-side persistence of messages.
- Real-time collaborative chat.
- File upload or multimodal input.
- AI model fine-tuning or admin dashboard.

## 4. Users and Personas
### Primary user
- A person using a browser-based AI assistant for quick Q&A and task support.

### Typical flow
1. User opens the app.
2. User creates a new chat or selects an existing one.
3. User enters a prompt.
4. App sends the message to `/api/chat`.
5. App displays the reply and updates the conversation list.

## 5. Functional Requirements

### 5.1 Conversation lifecycle
- The app must allow a user to start a new conversation.
- A new conversation must create a unique ID and initial title derived from the first user prompt.
- User messages and AI messages must be stored in a conversation object.
- Conversations must be ordered by newest updated time.
- Each conversation must maintain:
  - id
  - title
  - messages
  - folderId
  - createdAt
  - updatedAt
  - isRenamedManually

### 5.2 Message model
Each message must contain:
- id
- role (`user` or `assistant`)
- content
- createdAt

The app must render `user` and `assistant` messages with distinct styling and placement.

### 5.3 Chat input behavior
- User text input must support multi-line editing.
- Empty input must not trigger a request.
- When a request is in progress, the send action must be disabled.
- The app must trim whitespace before sending.
- The input field must refocus after creating or selecting a conversation.

### 5.4 API request flow
When sending a message:
1. The app builds a message list with the current conversation messages + the new user message.
2. If no conversation is active, a new conversation is created.
3. The app sends a POST request to `/api/chat` with:
   - `messages`
   - `language`
4. If the backend returns a valid response with a `message` property, the assistant message is appended to the conversation.
5. If the request fails, the app shows an error message and does not corrupt the conversation state.

### 5.5 Sidebar and history
- The sidebar must list conversations filtered by search term.
- The sidebar must support creating a new conversation.
- The sidebar must support selecting an existing conversation.
- The sidebar must support deleting a conversation.
- The sidebar must support renaming a conversation.
- The sidebar must support moving a conversation into a folder.

### 5.6 Folder management
- Users can create folders.
- Users can rename folders.
- Users can delete folders.
- Deleting a folder must remove the folder association from contained conversations.
- Folders can be expanded/collapsed in the UI.

### 5.7 Settings and personalization
- The app must support language selection (`en` / `fa`).
- The app must support light/dark theme (`light` / `dark`).
- Settings must persist across browser refreshes.
- Sidebar visibility state must persist.
- Expanded folder state must persist.

### 5.8 Responsive behavior
- On mobile, the sidebar must behave as an overlay drawer.
- On desktop, the sidebar should remain visible when enabled.
- Empty state content must be displayed when there are no messages in the active conversation.

## 6. Data Storage
The app stores user state in browser local storage.

Required stored keys include:
- conversations
- activeConversation
- folders
- expandedFolders
- sidebarOpen
- language
- theme

Storage is hydrated on client startup and saved whenever relevant state changes.

## 7. UI Structure
### Main layout
- Top-level container: app wrapper with full-screen layout
- Header with:
  - sidebar toggle button
  - app title
  - current conversation label
  - readiness indicator
- Main content area containing:
  - chat history list
  - empty state or message list
  - loading indicator
  - final input composer

### Message rendering
- User messages align to the right or in the active direction context.
- Assistant messages align to the left.
- Loading state uses animated dots.

## 8. Backend API Contract
The app expects a backend endpoint at `/api/chat`.

### Request payload
```json
{
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "Hello",
      "createdAt": 1720000000000
    }
  ],
  "language": "en"
}
```

### Success response format
```json
{
  "message": {
    "id": "msg_456",
    "role": "assistant",
    "content": "Hi! How can I help?",
    "createdAt": 1720000000500
  }
}
```

### Error response format
The app accepts a response that includes a string `error` field if the request fails.

```json
{
  "error": "Unable to get a response."
}
```

## 9. Acceptance Criteria
- A user can open the app and view the chat interface.
- A user can send a message and receive a response from the `/api/chat` endpoint.
- A conversation remains available after page refresh.
- A user can create multiple conversations and switch between them.
- A user can organize conversations into folders.
- A user can change language and theme settings.
- The app works on both mobile and desktop layouts.
- Empty or invalid API responses produce a visible error state.

## 10. Edge Cases
- If there is no active conversation, app must create one when sending a new message.
- If there are no conversations, the empty state must render correctly.
- If the selected conversation is deleted, the app must select the next available conversation or remain empty.
- If the backend returns malformed data, the app must not crash.
- If local storage is empty or missing, the app must initialize defaults safely.

## 11. Implementation Notes
The current implementation is a client-first app with local persistence and a simple backend API integration point. The app is structured around:
- client UI components (`components/*`)
- local persistence logic (`lib/storage.ts`)
- shared types (`lib/types.ts`)
- a Next.js route endpoint for AI responses

## 12. Future Considerations
Potential improvements include:
- server-side persistence
- authenticated accounts
- streaming responses
- markdown rendering for assistant messages
- conversation export/import
- AI provider abstraction and model selection
- analytics and usage tracking

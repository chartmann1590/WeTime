# AI Assistant Documentation

## Overview

The WeTime AI Assistant is an intelligent calendar assistant powered by Ollama that allows users to interact with their calendar using natural language. Users can ask questions about their schedule, view upcoming events, and create new events through conversational chat.

## Features

### Core Capabilities

- **Natural Language Queries**: Ask questions about your calendar in plain English
- **Schedule Viewing**: Query upcoming events, today's schedule, or events for specific dates
- **Event Creation**: Create new calendar events through conversation
- **Date Awareness**: The AI understands current date/time and distinguishes between past and future events
- **Calendar Integration**: Fully integrated with your existing calendars and events

### Chat Interface

- **Location**: Fixed chat button in the bottom-right corner of the calendar page
- **Modal Design**: Opens as a chat modal overlay
- **Message History**: View conversation history during the session
- **Real-time Responses**: Get instant AI responses to your questions

## Setup and Configuration

### Prerequisites

1. **Ollama Installation**: You need Ollama installed and running on your system or accessible server
   - Download from: https://ollama.ai
   - Default URL: `http://localhost:11434`
   - For remote servers, use the server's IP address or domain

2. **Ollama Models**: At least one language model must be available in Ollama
   - Recommended models: `llama3.2`, `phi3`, `mistral`, `gemma`
   - Smaller models (1B-3B parameters) work well for calendar tasks
   - Larger models provide better understanding but require more resources

### Configuration Steps

1. **Navigate to Settings**:
   - Click the Settings icon in the header
   - Scroll to the "AI Assistant (Ollama)" section

2. **Configure Ollama URL**:
   - Enter your Ollama server URL (e.g., `http://localhost:11434`)
   - For remote servers: `http://your-server-ip:11434`
   - Click "Load Models" to test the connection

3. **Select a Model**:
   - After loading models, select your preferred model from the dropdown
   - Smaller models are faster but less capable
   - Larger models are more capable but slower

4. **CPU Mode (Optional)**:
   - Check "Force CPU mode" if you encounter CUDA/GPU errors
   - Useful if you don't have a compatible GPU or CUDA drivers
   - CPU mode is slower but more compatible

5. **Save Settings**:
   - Click "Save AI Settings" to store your configuration
   - Settings are saved per-user and persist across sessions

### Troubleshooting

#### Connection Issues

**Problem**: "Failed to connect to Ollama"
- **Solution**: 
  - Verify Ollama is running: `ollama serve` or check the service status
  - Check the URL is correct (include `http://` or `https://`)
  - Ensure firewall allows connections to port 11434
  - For Docker: ensure Ollama container is accessible

**Problem**: "No models found"
- **Solution**:
  - Pull a model: `ollama pull llama3.2:1b`
  - Verify models: `ollama list`
  - Check Ollama logs for errors

#### CUDA/GPU Errors

**Problem**: "CUDA error" or "GPU error"
- **Solutions**:
  1. Enable "Force CPU mode" in settings
  2. Use a smaller model that fits in GPU memory
  3. Check CUDA drivers are installed and compatible
  4. Verify GPU is available: `nvidia-smi` (for NVIDIA GPUs)

**Problem**: "Out of memory"
- **Solution**:
  - Use a smaller model (e.g., `llama3.2:1b` instead of `llama3.2:3b`)
  - Enable CPU mode
  - Reduce context size (future feature)

## Usage Guide

### Basic Queries

#### Viewing Your Schedule

**Examples**:
- "What's on my schedule today?"
- "What do I have coming up this week?"
- "Show me my events for tomorrow"
- "What's scheduled for next Monday?"

**Response**: The AI will list your upcoming events with dates, times, and details.

#### Asking About Specific Dates

**Examples**:
- "What's happening on January 15th?"
- "Do I have anything scheduled next Friday?"
- "What events are in my calendar for this month?"

**Response**: The AI filters events for the specified date range.

#### Creating Events

**Examples**:
- "Create a meeting with John tomorrow at 2pm"
- "Add a dentist appointment on Friday at 10am"
- "Schedule a team meeting next Monday from 9am to 10am"
- "Create an all-day event called 'Vacation' starting next week"

**Response**: The AI creates the event and confirms creation.

### Advanced Usage

#### Natural Language Event Creation

The AI understands various date/time formats:
- Relative dates: "tomorrow", "next week", "in 3 days"
- Specific dates: "January 15th", "next Friday", "the 20th"
- Time formats: "2pm", "14:00", "2:00 PM"
- Durations: "for 1 hour", "from 9am to 10am", "all day"

#### Event Details

You can include additional details:
- Location: "at the office", "at 123 Main St"
- Description: "team sync meeting", "quarterly review"
- Calendar: The AI uses your default personal calendar

### Best Practices

1. **Be Specific**: More specific queries get better results
   - Good: "What meetings do I have tomorrow afternoon?"
   - Less clear: "What's happening?"

2. **Date Context**: The AI knows the current date, so you can use relative terms
   - "today", "tomorrow", "next week" all work

3. **Event Creation**: Include all details in one message
   - "Create a dentist appointment tomorrow at 2pm at 123 Main St"

4. **Model Selection**: 
   - For quick responses: Use smaller models (1B-3B)
   - For better understanding: Use larger models (7B+)

## Technical Details

### Architecture

#### Backend Components

1. **API Routes** (`apps/backend/src/app/api/ai-assistant/`):
   - `settings/route.ts`: Get/save Ollama configuration
   - `models/route.ts`: Fetch available models from Ollama
   - `chat/route.ts`: Handle chat messages and event creation

2. **Services**:
   - `apps/backend/src/lib/ollama.ts`: Ollama API client
   - `apps/backend/src/lib/ai-context.ts`: Calendar context builder

3. **Database**:
   - `AiAssistantSetting` model stores per-user configuration
   - Fields: `ollamaUrl`, `selectedModel`, `useCpu`

#### Frontend Components

1. **Chat Modal** (`apps/frontend/src/components/ai-assistant/chat-modal.tsx`):
   - Fixed position button (bottom-right)
   - Chat interface with message history
   - Real-time AI responses

2. **Settings UI** (`apps/frontend/src/app/settings/page.tsx`):
   - Ollama URL configuration
   - Model selection dropdown
   - CPU mode toggle

### Data Flow

1. **User sends message** → Frontend chat modal
2. **Frontend** → POST `/api/ai-assistant/chat`
3. **Backend**:
   - Fetches user's AI settings
   - Builds calendar context (events, calendars, user info)
   - Formats context as prompt for AI
   - Sends to Ollama API
   - Parses AI response
   - Creates event if requested
4. **Backend** → Returns AI response and event creation status
5. **Frontend** → Displays response and refreshes calendar if event created

### Calendar Context

The AI receives:
- Current date/time (in user's timezone)
- Available calendars (personal, shared, external)
- Upcoming events (future events only)
- Past events (last 5, marked as past)
- User timezone and preferences

### Event Creation

When the AI detects event creation intent:
1. Parses event details from response (title, date, time, location)
2. Selects appropriate calendar (defaults to personal calendar)
3. Creates event via Prisma
4. Returns confirmation to user

## API Reference

### GET `/api/ai-assistant/settings`

Get user's AI assistant settings.

**Response**:
```json
{
  "ollamaUrl": "http://localhost:11434",
  "selectedModel": "llama3.2:1b",
  "useCpu": false
}
```

### POST `/api/ai-assistant/settings`

Save AI assistant settings.

**Request**:
```json
{
  "ollamaUrl": "http://localhost:11434",
  "selectedModel": "llama3.2:1b",
  "useCpu": false
}
```

### GET `/api/ai-assistant/models?ollamaUrl=<url>`

Fetch available models from Ollama.

**Response**:
```json
{
  "models": ["llama3.2:1b", "llama3.2:3b", "phi3:mini"]
}
```

### POST `/api/ai-assistant/chat`

Send a chat message to the AI assistant.

**Request**:
```json
{
  "message": "What's on my schedule today?",
  "dateRangeStart": "2024-01-15T00:00:00Z",
  "dateRangeEnd": "2024-01-22T00:00:00Z"
}
```

**Response**:
```json
{
  "response": "You have 3 events today...",
  "eventCreated": false,
  "event": null
}
```

Or if an event was created:
```json
{
  "response": "I've created the event 'Team Meeting' for tomorrow at 2pm.",
  "eventCreated": true,
  "event": {
    "id": "...",
    "title": "Team Meeting",
    "startsAtUtc": "2024-01-16T14:00:00Z",
    ...
  }
}
```

## Security Considerations

1. **User Isolation**: Each user's AI settings are isolated
2. **Calendar Access**: AI only accesses calendars the user has permission to view
3. **Event Creation**: Events are created with proper ownership and permissions
4. **Ollama URL**: Users can configure their own Ollama instance (self-hosted)
5. **No Data Storage**: Chat messages are not persisted (session-only)

## Limitations

1. **Model Dependency**: Requires Ollama and compatible models
2. **Network Access**: Needs network access to Ollama server
3. **Performance**: Response time depends on model size and hardware
4. **Context Window**: Limited by model's context window size
5. **Event Parsing**: Event creation relies on AI correctly parsing natural language

## Future Enhancements

- Chat history persistence
- Multi-turn conversations with context
- Event editing and deletion via chat
- Calendar-specific queries
- Recurring event creation
- Event reminders and notifications
- Integration with external calendar services
- Voice input support
- Mobile app integration

## Troubleshooting Guide

### Common Issues

#### "AI assistant not configured"
- **Cause**: Settings not saved or missing Ollama URL/model
- **Fix**: Go to Settings → AI Assistant and configure Ollama

#### "Failed to chat with Ollama"
- **Cause**: Ollama server not accessible or model not available
- **Fix**: 
  - Check Ollama is running
  - Verify URL is correct
  - Ensure model is pulled: `ollama pull <model-name>`

#### "CUDA error" or "GPU error"
- **Cause**: GPU/CUDA issues
- **Fix**: Enable "Force CPU mode" in settings

#### AI mentions past events when asked about schedule
- **Cause**: This should be fixed in the latest version
- **Fix**: Ensure backend is updated with latest date-aware context formatting

#### Events not being created
- **Cause**: AI response doesn't match expected format
- **Fix**: Be more explicit in event creation requests, include all details

## Support

For issues or questions:
1. Check this documentation
2. Review Ollama documentation: https://ollama.ai/docs
3. Check application logs for detailed error messages
4. Verify Ollama is working: `ollama run llama3.2:1b`


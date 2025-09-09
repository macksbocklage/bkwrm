# AI Chatbot Setup

## Environment Variables Required

Add the following environment variable to your `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API keys section
4. Create a new secret key
5. Copy the key and add it to your `.env.local` file

## Features

- **GPT-4o Integration**: Uses OpenAI's latest GPT-4o model for high-quality responses
- **Book Context**: Automatically extracts and provides book content as context to the AI
- **Conversation History**: Maintains conversation context for natural dialogue
- **Content Restriction**: AI is instructed to only answer questions about the book content
- **User Authentication**: Requires user to be logged in via Clerk

## Usage

The chatbot will appear on the right side of the EPUB reader when activated. It can:

- Answer questions about characters, plot, themes, and other book elements
- Provide analysis and interpretations based on the text
- Help with comprehension of complex passages
- Discuss literary elements and writing style

The AI is programmed to stay focused on the book content and will not provide information from external sources about the book or author.

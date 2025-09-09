import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 });
    }

    const { message, bookContent, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Prepare the system message with book context
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant helping users understand and discuss a book they are reading. Your role is to:

1. Answer questions about the book content provided
2. Provide insights, analysis, and interpretations based solely on the text
3. Help with comprehension, themes, characters, and plot points
4. Refuse to answer questions that are not related to the book content
5. Be concise but informative in your responses

IMPORTANT: Only use information from the provided book content. Do not use external knowledge about the book or author unless it's to provide basic context.

${bookContent ? `Book Content Context:\n${bookContent.slice(0, 15000)}\n\nIf the book content is too long, focus on the most relevant sections to answer the user's question.` : 'No book content provided in this request.'}

Remember: Stay focused on the book content and help the user understand what they're reading.`
    };

    // Prepare messages array with conversation history
    const messages = [
      systemMessage,
      ...(conversationHistory || []),
      { role: 'user' as const, content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({ 
        error: 'No response generated' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: response,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Fetch available models from Ollama API
 */
export async function fetchModels(ollamaUrl: string): Promise<string[]> {
  try {
    const url = new URL('/api/tags', ollamaUrl);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.models || []).map((model: OllamaModel) => model.name);
  } catch (error: any) {
    throw new Error(`Failed to connect to Ollama at ${ollamaUrl}: ${error.message}`);
  }
}

/**
 * Send a chat message to Ollama
 */
export async function chat(
  ollamaUrl: string,
  model: string,
  messages: OllamaChatMessage[],
  options?: { num_gpu?: number; use_cpu?: boolean }
): Promise<string> {
  try {
    const url = new URL('/api/chat', ollamaUrl);
    const requestBody: any = {
      model,
      messages,
      stream: false,
    };
    
    // Add options to force CPU mode if needed
    if (options?.use_cpu || options?.num_gpu === 0) {
      requestBody.options = {
        num_gpu: 0, // Force CPU mode
      };
    }
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Ollama API error: ${response.statusText}`;
      
      // Try to parse error JSON
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
          
          // Provide helpful suggestions for common errors
          if (errorMessage.includes('CUDA error') || errorMessage.includes('CUDA')) {
            errorMessage = `CUDA/GPU Error: ${errorJson.error}. This usually means:\n` +
              `1. The model is too large for your GPU memory\n` +
              `2. CUDA drivers are not properly installed\n` +
              `3. Try using a smaller model or CPU-only mode\n` +
              `4. Check Ollama logs for more details`;
          } else if (errorMessage.includes('out of memory') || errorMessage.includes('OOM')) {
            errorMessage = `Out of Memory: ${errorJson.error}. Try using a smaller model or reduce context size.`;
          }
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message?.content || '';
  } catch (error: any) {
    throw new Error(`Failed to chat with Ollama: ${error.message}`);
  }
}

/**
 * Parse event creation details from AI response
 * Looks for structured JSON or natural language patterns
 */
export function parseEventCreation(response: string): {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  calendarId?: string;
} | null {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title || parsed.action === 'create_event') {
        return {
          title: parsed.title,
          description: parsed.description,
          location: parsed.location,
          startsAt: parsed.startsAt || parsed.start,
          endsAt: parsed.endsAt || parsed.end,
          allDay: parsed.allDay,
          calendarId: parsed.calendarId,
        };
      }
    } catch (e) {
      // Not valid JSON, continue with pattern matching
    }
  }

  // Pattern matching for natural language
  const titleMatch = response.match(/title[:\s]+["']?([^"'\n]+)["']?/i);
  const dateMatch = response.match(/(\d{4}-\d{2}-\d{2})/);
  const timeMatch = response.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (titleMatch) {
    return {
      title: titleMatch[1].trim(),
      description: response,
    };
  }

  return null;
}


'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { MessageCircle, Send, X } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  eventCreated?: boolean
}

interface ChatModalProps {
  dateRangeStart?: Date
  dateRangeEnd?: Date
  onEventCreated?: () => void
}

export function ChatModal({ dateRangeStart, dateRangeEnd, onEventCreated }: ChatModalProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await api.aiAssistant.chat(userMessage, dateRangeStart, dateRangeEnd)
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
          eventCreated: response.eventCreated || false,
        },
      ])

      if (response.eventCreated && onEventCreated) {
        onEventCreated()
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to get response from AI assistant'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col bg-background border border-border rounded-lg shadow-2xl">
          <DialogHeader className="flex-shrink-0 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <DialogTitle>AI Assistant</DialogTitle>
              <DialogClose onClose={() => setOpen(false)} />
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ask me about your calendar!</p>
                <p className="text-xs mt-2">Try: &quot;What do I have scheduled today?&quot;</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    {msg.eventCreated && (
                      <div className="text-xs mt-2 opacity-75">
                        ✓ Event created successfully
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="text-sm text-muted-foreground">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your calendar..."
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}



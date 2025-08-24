import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Search, MessageCircle, Plus, User, Clock, Send } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { MessageThread, Message } from "@shared/schema";

async function getMessageThreads(): Promise<MessageThread[]> {
  const response = await fetch("/api/msg/threads");
  return response.json();
}

async function getMessages(threadId: string): Promise<Message[]> {
  const response = await apiRequest("GET", `/api/messages/threads/${threadId}/messages`);
  return response.json();
}

async function createMessageThread(topic: string, createdBy: string): Promise<MessageThread> {
  console.log("Creating thread with direct fetch:", { topic, createdBy });
  
  // Use direct fetch with timeout to avoid hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
    const response = await fetch("/api/msg/create-thread", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        createdBy
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Thread creation successful:", result);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Thread creation failed:", error);
    throw error;
  }
}

async function createMessage(threadId: string, content: string, createdBy: string): Promise<Message> {
  const response = await apiRequest("POST", `/api/messages/threads/${threadId}/messages`, {
    content,
    createdBy
  });
  return response.json();
}

async function searchMessages(query?: string, date?: string): Promise<{ thread: MessageThread; messages: Message[] }[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (date) params.append('date', date);
  
  const response = await apiRequest("GET", `/api/messages/search?${params.toString()}`);
  return response.json();
}

export default function MessageCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State for mobile-style interface
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [newThreadTopic, setNewThreadTopic] = useState("");
  
  // State for messages
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});

  const { data: threads = [], refetch: refetchThreads } = useQuery({
    queryKey: ["/api", "message-threads"],
    queryFn: getMessageThreads,
  });

  // Load messages for selected thread
  const loadMessagesMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const messages = await getMessages(threadId);
      return { threadId, messages };
    },
    onSuccess: (data) => {
      setThreadMessages(prev => ({
        ...prev,
        [data.threadId]: data.messages
      }));
    }
  });

  // Create new thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (topic: string) => {
      return await createMessageThread(topic, user?.id || 'test-user-001');
    },
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ["/api", "message-threads"] });
      setSelectedThread(newThread.id);
      setShowNewThreadDialog(false);
      setNewThreadTopic("");
      toast({
        title: "Message Thread Created",
        description: `New conversation "${newThread.topic}" started.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create message thread",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const message = await createMessage(threadId, content, user?.id || 'test-user-001');
      return { threadId, message };
    },
    onSuccess: (data) => {
      setThreadMessages(prev => ({
        ...prev,
        [data.threadId]: [...(prev[data.threadId] || []), data.message]
      }));
      setNewMessage("");
      // Update thread timestamp by refetching threads
      queryClient.invalidateQueries({ queryKey: ["/api", "message-threads"] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread && !threadMessages[selectedThread]) {
      loadMessagesMutation.mutate(selectedThread);
    }
  }, [selectedThread]);

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    return thread.topic.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get selected thread data
  const currentThread = threads.find(t => t.id === selectedThread);
  const currentMessages = selectedThread ? (threadMessages[selectedThread] || []) : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Thread List - Mobile Phone Style */}
      <div className="w-full max-w-md border-r border-gray-700 bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </h1>
            
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-new-message"
              onClick={() => setShowNewThreadDialog(true)}
            >
              <Plus className="h-4 w-4" />
              New
            </Button>

            <Dialog 
              open={showNewThreadDialog} 
              onClose={() => setShowNewThreadDialog(false)}
              title="Start New Conversation"
              description="Enter a topic for your new message thread."
              footer={
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => setShowNewThreadDialog(false)}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (newThreadTopic.trim()) {
                        createThreadMutation.mutate(newThreadTopic.trim());
                      }
                    }}
                    disabled={!newThreadTopic.trim() || createThreadMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-create-thread"
                  >
                    {createThreadMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-white mb-2">
                    Topic
                  </label>
                  <Input
                    id="topic"
                    value={newThreadTopic}
                    onChange={(e) => setNewThreadTopic(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter conversation topic..."
                    data-testid="input-topic"
                  />
                </div>
              </div>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">No conversations yet</p>
              <p className="text-gray-500 text-sm">Start a new conversation to get started</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread === thread.id;
              return (
                <div
                  key={thread.id}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-gray-600' : ''
                  }`}
                  onClick={() => setSelectedThread(thread.id)}
                  data-testid={`thread-item-${thread.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{thread.topic}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedThread && currentThread ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <h2 className="text-lg font-semibold text-white">{currentThread.topic}</h2>
              <p className="text-sm text-gray-400">
                Started {format(new Date(currentThread.createdAt), 'MMM d, yyyy at h:mm a')}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadMessagesMutation.isPending ? (
                <div className="text-center py-8 text-gray-400">Loading messages...</div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No messages yet. Be the first to send a message!
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div key={message.id} className="flex gap-3" data-testid={`message-${message.id}`}>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {message.createdBy}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(message.createdAt), 'MMM d, yyyy at h:mm a')}
                        </span>
                      </div>
                      <div className="bg-gray-700 rounded-lg rounded-tl-none p-3">
                        <p className="text-gray-100 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMessageMutation.mutate({
                            threadId: selectedThread,
                            content: newMessage.trim()
                          });
                        }
                      }
                    }}
                    className="bg-gray-700 border-gray-600 text-white resize-none rounded-lg min-h-[44px] max-h-32"
                    rows={1}
                    data-testid="textarea-message"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newMessage.trim()) {
                      sendMessageMutation.mutate({
                        threadId: selectedThread,
                        content: newMessage.trim()
                      });
                    }
                  }}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shrink-0 h-[44px]"
                  data-testid="button-send"
                >
                  {sendMessageMutation.isPending ? (
                    "..."
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a message thread to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
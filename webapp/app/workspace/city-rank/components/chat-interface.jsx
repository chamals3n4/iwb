"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Wifi, WifiOff } from "lucide-react";
import { User } from "@asgardeo/nextjs";

const API_BASE_URL = "http://localhost:8080";
const WS_BASE_URL = "ws://localhost:9090/chat";

function ChatInterfaceInner({ cityId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatConnected, setChatConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const currentUser = {
    id: user?.sub || user?.email || "guest-user",
    name:
      user?.given_name && user?.family_name
        ? `${user.given_name.trim()} ${user.family_name.trim()}`
        : user?.given_name?.trim()
          ? user.given_name.trim()
          : user?.family_name?.trim()
            ? user.family_name.trim()
            : user?.email || "Guest",
  };

  const formatTimestamp = (timestamp) => {
    try {
      let date;
      if (Array.isArray(timestamp) && timestamp.length > 0) {
        date = new Date(
          timestamp[0] * 1000 + Math.floor((timestamp[1] || 0) / 1e6),
        );
      } else {
        date = new Date(timestamp);
      }
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(
        `${API_BASE_URL}/api/chat/history/city/${cityId}`,
      );
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const formattedMessages = data.data.map((msg) => ({
          id: msg.messageId,
          user: msg.userName,
          userId: msg.userId,
          message: msg.message,
          timestamp: formatTimestamp(msg.timestamp),
          isOwn: msg.userId === currentUser.id,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        setChatConnected(true);
        ws.send(
          JSON.stringify({
            type: "join",
            data: {
              cityId,
              userId: currentUser.id,
              userName: currentUser.name,
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message" && data.data) {
            const newMsg = {
              id: data.data.messageId,
              user: data.data.userName,
              userId: data.data.userId,
              message: data.data.message,
              timestamp: formatTimestamp(data.data.timestamp),
              isOwn: data.data.userId === currentUser.id,
            };
            setMessages((prev) =>
              prev.some((msg) => msg.id === newMsg.id)
                ? prev
                : [...prev, newMsg],
            );
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setChatConnected(false);
        reconnectTimeoutRef.current = setTimeout(
          () => connectWebSocket(),
          3000,
        );
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setChatConnected(false);
      };
    } catch (err) {
      console.error("Error connecting to WebSocket:", err);
      setChatConnected(false);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      isSending
    )
      return;

    setIsSending(true);
    try {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          data: {
            cityId,
            userId: currentUser.id,
            userName: currentUser.name,
            message: newMessage.trim(),
          },
        }),
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (cityId) {
      loadChatHistory();
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, [cityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    return hash;
  }
  function getColor(str, offset = 0) {
    const hash = hashCode(str);
    const h = Math.abs((hash + offset * 111) % 360);
    return `hsl(${h}, 70%, 60%)`;
  }
  function vercelGradient(str) {
    return `linear-gradient(135deg, ${getColor(str, 0)}, ${getColor(str, 1)})`;
  }
  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold text-left">
            Community Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            {chatConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-xs ${chatConnected ? "text-green-600" : "text-red-600"}`}
            >
              {chatConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-left">
          {messages.length} messages • Connect with other travelers and locals
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea
          ref={chatContainerRef}
          className="flex-1 px-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db #f9fafb" }}
        >
          <div className="space-y-4 pb-4">
            {loadingHistory && (
              <div className="text-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading chat history...
                </p>
              </div>
            )}

            {messages.length === 0 && !loadingHistory && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    background: vercelGradient(
                      msg.userId || msg.user || "guest",
                    ),
                  }}
                  title={msg.user}
                >
                  {getInitials(msg.user)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-medium ${msg.isOwn ? "text-blue-600" : "text-foreground"}`}
                    >
                      {msg.isOwn ? "You" : msg.user}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="inline-block px-3 py-2 rounded-lg text-sm bg-muted max-w-[80%]">
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder={
                chatConnected ? "Type your message..." : "Connecting to chat..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={!chatConnected}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || !chatConnected || isSending}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          {!chatConnected && (
            <p className="text-xs text-red-500 mt-2">
              Chat is disconnected. Trying to reconnect...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChatInterface({ cityId }) {
  return (
    <User>{(user) => <ChatInterfaceInner cityId={cityId} user={user} />}</User>
  );
}

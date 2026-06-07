"use client";

import React, { useState, useEffect, useRef } from "react";
import { User } from "@asgardeo/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Calendar,
  Users,
  Clock,
  MapPin,
  Loader2,
  XCircle,
  DollarSign,
  Wifi,
  WifiOff,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8080";
const WS_BASE_URL = "ws://localhost:9090";

function MeetupDetailsPageInner({ params, user }) {
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const currentUser = {
    id:
      user?.sub ||
      user?.email ||
      "guest-" + Math.random().toString(36).substr(2, 9),
    name:
      user?.given_name && user?.family_name
        ? `${user.given_name.trim()} ${user.family_name.trim()}`
        : user?.given_name?.trim()
          ? user.given_name.trim()
          : user?.family_name?.trim()
            ? user.family_name.trim()
            : user?.email || "Guest User",
  };

  const fetchMeetupDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/meetups/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        if (data.success && data.data) {
          setMeetup(data.data);
        } else {
          setError(data.message || "Meetup not found");
        }
      } else {
        setError(data.message || "Failed to fetch meetup details");
      }
    } catch (err) {
      setError("Network error: Unable to fetch meetup details");
      console.error("Error fetching meetup:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(
        `${API_BASE_URL}/api/chat/history/${params.id}`,
      );
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const formattedMessages = data.data.map((msg) => ({
          id: msg.messageId,
          user: msg.userName,
          userId: msg.userId,
          message: msg.message,
          timestamp: formatTimestamp(msg.timestamp),
          isOrganizer: false,
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        setChatConnected(true);
        ws.send(
          JSON.stringify({
            type: "join",
            data: {
              meetupId: params.id,
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
              isOrganizer: false,
            };

            setMessages((prev) => {
              const messageExists = prev.some((msg) => msg.id === newMsg.id);
              if (messageExists) return prev;
              return [...prev, newMsg];
            });
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

  const formatDateTime = (date, time) => {
    try {
      const datetime = new Date(`${date}T${time}`);
      return {
        date: datetime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: datetime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: date, time: time };
    }
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getEstimatedAttendees = (event) => {
    if (event.hasLimitedCapacity && event.eventCapacity) {
      return Math.floor(event.eventCapacity * (0.6 + Math.random() * 0.2));
    }
    return Math.floor(Math.random() * 50) + 10;
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
            meetupId: params.id,
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
    fetchMeetupDetails();
  }, [params.id]);

  useEffect(() => {
    if (meetup) {
      loadChatHistory();
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, [meetup, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading meetup details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Alert className="border-red-200 bg-red-50 mb-6 max-w-md">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchMeetupDetails} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Meetup not found
          </h1>
          <p className="text-gray-600">
            The meetup you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const { time } = formatDateTime(meetup.eventStartDate, meetup.eventStartTime);
  const estimatedAttendees = getEstimatedAttendees(meetup);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
          <div
            className="lg:col-span-2 overflow-y-auto custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#d1d5db #f9fafb",
            }}
          >
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f9fafb;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `}</style>
            <div className="relative mb-8">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={meetup.imageUrl || "/images/hero.avif"}
                  alt={meetup.eventName}
                  className="w-full h-72 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hero.avif";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      Event
                    </Badge>
                    {meetup.isPaidEvent && (
                      <Badge className="bg-green-500/20 text-green-100 border-green-300/30 backdrop-blur-sm">
                        Paid Event
                      </Badge>
                    )}
                    {meetup.hasLimitedCapacity && (
                      <Badge className="bg-orange-500/20 text-orange-100 border-orange-300/30 backdrop-blur-sm">
                        Limited Capacity
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {meetup.eventName}
                  </h1>
                  <div className="flex items-center text-white/90 text-lg">
                    <MapPin className="w-5 h-5 mr-2" />
                    {meetup.venueName}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 mb-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Date</h3>
                    <p className="text-gray-600">
                      {formatDisplayDate(meetup.eventStartDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Time</h3>
                    <p className="text-gray-600">{time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Users className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Attendees</h3>
                    <p className="text-gray-600">
                      {estimatedAttendees} going
                      {meetup.hasLimitedCapacity &&
                        ` (${meetup.eventCapacity} max)`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {meetup.isPaidEvent && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">
                      {formatCurrency(meetup.eventCost)}
                    </span>
                  </div>
                )}
                {meetup.requireApproval && (
                  <div className="px-4 py-2 bg-blue-50 rounded-xl">
                    <span className="text-blue-800 font-medium">
                      Approval Required
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIsJoined(!isJoined)}
                className={`w-full md:w-auto px-8 py-3 text-base font-semibold rounded-xl transition-all ${isJoined ? "bg-green-600 hover:bg-green-700 text-white" : "bg-black hover:bg-gray-800 text-white"}`}
              >
                {isJoined ? "✓ Joined" : "Join Meetup"}
              </Button>
            </div>

            <div className="bg-white rounded-2xl p-8 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold text-black mb-6">Organizer</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src="/placeholder.svg?height=48&width=48"
                    alt="Event Organizer"
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-black text-lg">
                    {meetup.organizerName || "Event Organizer"}
                  </h3>
                  <p className="text-gray-600">Event Organizer</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-black mb-6">
                About this meetup
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-base">
                  {meetup.eventDescription ||
                    "Join us for this exciting meetup! We'll have great discussions, networking opportunities, and a chance to connect with like-minded individuals."}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-black">Live Chat</h2>
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
                <p className="text-sm text-gray-500">
                  {messages.length} messages
                </p>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar"
                style={{
                  maxHeight: "calc(100vh - 320px)",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#d1d5db #f9fafb",
                }}
              >
                {loadingHistory && (
                  <div className="text-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Loading chat history...
                    </p>
                  </div>
                )}

                {messages.length === 0 && !loadingHistory && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base"
                      style={{
                        background: vercelGradient(
                          message.userId || message.user || "guest",
                        ),
                      }}
                      title={message.user}
                    >
                      {getInitials(message.user)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-semibold text-sm ${message.userId === currentUser.id ? "text-blue-600" : message.isOrganizer ? "text-purple-600" : "text-black"}`}
                        >
                          {message.userId === currentUser.id
                            ? "You"
                            : message.user}
                          {message.isOrganizer && (
                            <Badge className="ml-2 text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                              Organizer
                            </Badge>
                          )}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    type="text"
                    placeholder={
                      chatConnected
                        ? "Type your message..."
                        : "Connecting to chat..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-gray-200 focus:border-black focus:ring-black rounded-xl"
                    disabled={!chatConnected}
                  />
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-gray-800 rounded-xl px-4"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetupDetailsPage({ params }) {
  return (
    <User>
      {(user) => <MeetupDetailsPageInner params={params} user={user} />}
    </User>
  );
}

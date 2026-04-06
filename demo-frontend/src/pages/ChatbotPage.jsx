import React, { useEffect, useRef, useState } from "react";
import { answerChat, startChat } from "../services/chatbotService";
import "./ChatbotPage.css";

const ChatbotPage = () => {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const chatBodyRef = useRef(null);

  const appendMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const withHeadings = (text) => {
    const value = String(text || "").trim();
    if (!value) return value;

    const lower = value.toLowerCase();
    if (
      lower.includes("summary:") ||
      lower.includes("medical advice:") ||
      lower.includes("self-care:") ||
      lower.includes("final note:")
    ) {
      return value;
    }

    const paragraphs = value
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const fallbackParagraphs =
      paragraphs.length > 1
        ? paragraphs
        : value
            .split(/(?<=[.!?])\s+/)
            .reduce((acc, sentence, idx) => {
              const bucket = Math.floor(idx / 2);
              acc[bucket] = (acc[bucket] ? `${acc[bucket]} ` : "") + sentence;
              return acc;
            }, [])
            .map((p) => p.trim())
            .filter(Boolean);

    const headings = ["Summary", "Medical Advice", "Self-Care", "Final Note"];

    return fallbackParagraphs
      .map((p, i) => `${headings[Math.min(i, headings.length - 1)]}:\n${p}`)
      .join("\n\n");
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = async () => {
    setLoading(true);
    setError("");
    setMessages([]);
    setCompleted(false);

    try {
      const data = await startChat();
      setSessionId(data.sessionId);
      appendMessage("bot", data.question || "What symptoms do you have?");
    } catch (e) {
      console.error(e);
      setError("Failed to start chatbot session");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      setError("Please enter your answer");
      return;
    }

    if (!sessionId || completed) {
      setError("Start chat first");
      return;
    }

    const answerText = input.trim();
    setInput("");
    setError("");
    appendMessage("user", answerText);
    setLoading(true);

    try {
      const data = await answerChat(sessionId, answerText);

      if (data.completed) {
        appendMessage("bot", withHeadings(data.recommendation || "Thank you."));
        setCompleted(true);
      } else {
        appendMessage("bot", data.question || "Please continue.");
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to send answer");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loading && !completed) {
        handleSend();
      }
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-shell">
        <div className="chatbot-header">
          <div>
            <h2 className="chatbot-title">AI Wellness Assistant</h2>
          </div>
        </div>

        <div className="chatbot-actions">
          <button
            onClick={handleStart}
            disabled={loading}
            className="chatbot-btn chatbot-btn-primary"
          >
            {loading ? "Starting..." : sessionId ? "Restart Session" : "Start Chat"}
          </button>
          {completed && (
            <span className="chatbot-complete-tag">Recommendation generated</span>
          )}
        </div>

        <div ref={chatBodyRef} className="chatbot-body">
          {messages.length === 0 ? (
            <div className="chatbot-empty">
              <p>Start a session to begin the guided health questionnaire.</p>
            </div>
          ) : (
            <div className="chatbot-message-list">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chatbot-message-row ${msg.role === "bot" ? "bot" : "user"}`}
                >
                  {msg.role === "bot" && <div className="chatbot-avatar">AI</div>}
                  <div className="chatbot-message-bubble">{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chatbot-input-wrap">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!sessionId || completed || loading}
            placeholder={
              completed
                ? "Session completed. Start a new session to ask again."
                : "Type your answer and press Enter..."
            }
            className="chatbot-input"
          />
          <button
            onClick={handleSend}
            disabled={!sessionId || completed || loading}
            className="chatbot-btn chatbot-btn-accent"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {error && <p className="chatbot-error">{error}</p>}
      </div>
    </div>
  );
};

export default ChatbotPage;

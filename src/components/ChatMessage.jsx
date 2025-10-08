import React from "react";
import { formatText } from "./MarkdownFormatter";

export const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  const containerClass = isUser ? "message-container user" : "message-container model";
  const bubbleClass = isUser ? "message-bubble user-bubble" : "message-bubble model-bubble";

  return (
    <div className={containerClass}>
      <div className="message-content">
        <div className={bubbleClass}>{formatText(message.text)}</div>

        {message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <span className="sources-label">Sources:</span>
            {message.sources.slice(0, 3).map((s, i) => (
              <a
                key={i}
                href={s.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                {s.title || `Source ${i + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// src/components/ChatMessage.jsx
import React from "react";
import { formatText } from "./MarkdownFormatter";

export const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  // Styling for alignment and bubbles
  const containerClass = isUser
    ? "flex justify-end mb-4"
    : "flex justify-start mb-4";

  const bubbleClass = isUser
    ? "bg-blue-500 text-white rounded-2xl rounded-br-none px-4 py-2 max-w-[75%]"
    : "bg-gray-200 text-black rounded-2xl rounded-bl-none px-4 py-2 max-w-[75%]";

  return (
    <div className={containerClass}>
      <div className="flex flex-col">
        <div className={bubbleClass}>{formatText(message.text)}</div>

        {message.sources && message.sources.length > 0 && (
          <div className="text-xs text-gray-500 mt-1 italic">
            <span className="font-semibold mr-1">Sources:</span>
            {message.sources.slice(0, 3).map((s, i) => (
              <a
                key={i}
                href={s.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-gray-600 mr-2"
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

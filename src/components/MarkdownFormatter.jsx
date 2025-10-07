// Simple Markdown to JSX converter for basic formatting (bold + newlines)
import React from "react";

export const formatText = (text) => {
  if (typeof text !== "string") return null;
  const boldSplitRegex = /(\*\*.*?\*\*)/g;
  const parts = text.split(boldSplitRegex);
  const finalOutput = [];
  let keyCounter = 0;

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("**") && part.endsWith("**")) {
      finalOutput.push(
        <strong key={`b-${keyCounter++}`}>{part.slice(2, -2)}</strong>
      );
      continue;
    }

    const lines = part.split("\n");
    lines.forEach((line, lineIndex) => {
      if (line) finalOutput.push(line);
      if (lineIndex < lines.length - 1)
        finalOutput.push(<br key={`br-${keyCounter++}`} />);
    });
  }

  return finalOutput;
};

import React from 'react';
import '@fontsource/jersey-10/400.css';

export const FONT = "'Jersey 10', monospace";

export type Word = { text: string; start: number; end: number };

/**
 * One sentence in a chunky pixel box, with the word being spoken in yellow.
 * `t` is seconds since the sentence's audio started.
 */
export const Caption: React.FC<{ words: Word[]; t: number; fontSize?: number; bottom?: number; maxWidth?: number }> = ({
  words, t, fontSize = 96, bottom = 40, maxWidth = 1640,
}) => {
  const active = words.findIndex((w) => t >= w.start && t < w.end);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth,
          padding: '20px 48px 26px',
          background: '#1a1c2c',
          // stepped pixel border: 8px white ring with notched corners
          boxShadow: '0 -8px 0 0 #f4f4f4, 0 8px 0 0 #f4f4f4, -8px 0 0 0 #f4f4f4, 8px 0 0 0 #f4f4f4, 0 16px 0 0 #1a1c2c',
          fontFamily: FONT,
          fontWeight: 400,
          fontSize,
          lineHeight: 1.1,
          color: '#f4f4f4',
          textAlign: 'center',
          WebkitFontSmoothing: 'none',
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i === active ? '#ffcd75' : '#f4f4f4' }}>
            {w.text}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

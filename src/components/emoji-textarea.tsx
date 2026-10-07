"use client";

import { useRef, useState } from "react";
import { marqueeEmojis } from "@/lib/catalog";

type EmojiTextareaProps = {
  name: string;
  initialValue: string;
  maxLength: number;
  rows?: number;
  minLength?: number;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export default function EmojiTextarea({ name, initialValue, maxLength, rows = 3, minLength = 0, required = false, onValueChange }: EmojiTextareaProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    if (next.length > maxLength) return;
    setValue(next);
    onValueChange?.(next);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  return <div className="emoji-textarea">
    <textarea ref={textareaRef} name={name} value={value} onChange={(event) => { setValue(event.target.value); onValueChange?.(event.target.value); }} rows={rows} maxLength={maxLength} minLength={minLength} required={required}/>
    <div className="emoji-toolbar" role="group" aria-label="إضافة رموز تعبيرية إلى الإعلان">
      {marqueeEmojis.map((emoji) => <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} aria-label={`إضافة ${emoji} إلى النص`} title={emoji}>{emoji}</button>)}
    </div>
  </div>;
}

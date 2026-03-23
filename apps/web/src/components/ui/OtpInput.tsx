import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Build exactly `length` slots; fill missing positions with empty string
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  function focusAt(index: number) {
    inputsRef.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  }

  function setCharAt(index: number, char: string) {
    const next = chars.slice();
    next[index] = char;
    onChange(next.join(''));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        focusAt(index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusAt(index + 1);
        break;
      case 'Backspace':
        e.preventDefault();
        if (chars[index]) {
          setCharAt(index, '');
        } else if (index > 0) {
          setCharAt(index - 1, '');
          focusAt(index - 1);
        }
        break;
      case 'Delete':
        e.preventDefault();
        setCharAt(index, '');
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(length - 1);
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          setCharAt(index, e.key);
          if (index < length - 1) focusAt(index + 1);
        }
        break;
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>, index: number) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length - index);
    if (!digits) return;
    const next = chars.slice();
    digits.split('').forEach((d, i) => {
      if (index + i < length) next[index + i] = d;
    });
    onChange(next.join(''));
    focusAt(Math.min(index + digits.length, length - 1));
  }

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2" role="group" aria-label="One-time code" data-otp-inputs>
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={char}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Verification Code ${index + 1}`}
          onChange={() => {
            /* handled in onKeyDown */
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(e, index)}
          className="booking-input w-10 text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}

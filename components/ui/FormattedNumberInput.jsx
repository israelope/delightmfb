'use client';

import { useRef, useCallback } from 'react';
import { formatWithCommas, parseFormattedNumber } from '@/lib/utils';

export default function FormattedNumberInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className,
  id,
  disabled,
  readOnly,
}) {
  const inputRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      const input = e.target;
      const rawOld = parseFormattedNumber(input.value);

      // Strip everything except digits and one decimal point
      let rawNew = rawOld.replace(/[^0-9.]/g, '');
      // Only allow one decimal point
      const parts = rawNew.split('.');
      if (parts.length > 2) rawNew = parts[0] + '.' + parts.slice(1).join('');

      const formatted = formatWithCommas(rawNew);

      // Calculate cursor position relative to raw digits before formatting
      const cursorRawPos = input.selectionStart;
      const rawBeforeCursor = parseFormattedNumber(input.value.slice(0, cursorRawPos));
      const digitsBeforeCursor = rawBeforeCursor.replace(/[^0-9]/g, '').length;

      // Restore cursor after formatting by counting past that many digits in the formatted string
      let newCursorPos = 0;
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (digitCount >= digitsBeforeCursor) break;
        if (formatted[i] !== ',') digitCount++;
        newCursorPos = i + 1;
      }
      // If cursor was at the very end, keep it at the end
      if (rawOld.length === rawBeforeCursor.length) {
        newCursorPos = formatted.length;
      }

      onChange(rawNew);

      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = newCursorPos;
          inputRef.current.selectionEnd = newCursorPos;
        }
      });
    },
    [onChange]
  );

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={formatWithCommas(value)}
      onChange={handleChange}
      className={className}
    />
  );
}

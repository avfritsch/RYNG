import { useState, useEffect, useRef } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onCommit: (value: string) => void;
}

export function DebouncedInput({ value, onCommit, ...props }: DebouncedInputProps) {
  const [local, setLocal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    // Strip leading zeros for number inputs (but keep "0" alone)
    if (props.type === 'number' && val.length > 1 && val.startsWith('0') && val[1] !== '.') {
      val = val.replace(/^0+/, '') || '0';
    }
    setLocal(val);
  }

  return (
    <input
      {...props}
      ref={inputRef}
      value={local}
      onChange={handleChange}
      onFocus={() => {
        // Select all text on focus so typing replaces the value
        setTimeout(() => inputRef.current?.select(), 0);
      }}
      onBlur={() => {
        if (local !== String(value)) {
          onCommit(local);
        }
      }}
    />
  );
}

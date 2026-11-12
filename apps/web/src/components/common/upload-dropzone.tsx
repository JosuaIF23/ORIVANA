import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/cn';

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain';

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Compact single-line zone (Sources, onboarding) or a large card (Home empty state). */
  size?: 'compact' | 'large';
  children: ReactNode;
  className?: string;
}

/** Drag-and-drop zone that is also a keyboard-operable file button. */
export function UploadDropzone({ onFile, disabled, size = 'compact', children, className }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'relative rounded-card border border-dashed border-control transition-colors',
        dragging ? 'border-accent bg-accent/5' : 'bg-surface/40',
        size === 'compact' ? 'px-6 py-6' : 'px-6 py-12',
        disabled && 'opacity-60',
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn('flex w-full rounded-control text-fg-secondary', size === 'compact' ? 'items-center justify-center gap-3 text-base' : 'flex-col items-center gap-4 text-center')}
      >
        <Upload aria-hidden="true" className={cn('shrink-0 text-accent', size === 'compact' ? 'size-5' : 'size-8')} />
        {children}
      </button>
    </div>
  );
}

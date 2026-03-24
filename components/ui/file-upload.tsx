'use client';

import { useState, useRef, forwardRef, ForwardedRef } from 'react';
import { Button, Text, Group, Stack } from '@mantine/core';
import { X, Upload, File, FileText } from 'lucide-react';

interface FileUploadProps {
  onChange: (files: File[]) => void;
  value: File[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
}

export const FileUpload = forwardRef((
  {
    onChange,
    value = [],
    multiple = false,
    maxFiles = 5,
    maxSize = 10, // Default 10MB
    accept = 'application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
    className,
  }: FileUploadProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (fileList: FileList): File[] => {
    const validFiles: File[] = [];
    setError(null);

    // Check if adding these files would exceed the max files limit
    if (value.length + fileList.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files`);
      return validFiles;
    }

    // Validate each file
    Array.from(fileList).forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the maximum size of ${maxSize}MB`);
        return;
      }

      // Add to valid files
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onChange([...value, ...validFiles]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onChange([...value, ...validFiles]);
      }
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return <File size={20} color="#3b82f6" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText size={20} color="#ef4444" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText size={20} color="#2563eb" />;
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText size={20} color="#16a34a" />;
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText size={20} color="#ea580c" />;
    } else {
      return <FileText size={20} color="#6b7280" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div ref={ref} className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: 24,
          borderRadius: 8,
          border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
          backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          onChange={handleChange}
          accept={accept}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Upload size={40} color="#6b7280" style={{ marginBottom: 8 }} />
          <Text size="sm" fw={500} mb="xs">
            Drag & drop files here, or click to select files
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Supports {accept.split(',').join(', ')}
          </Text>
          <Text size="xs" c="dimmed">
            Max {maxFiles} files, up to {maxSize}MB each
          </Text>
        </div>
      </div>

      {error && (
        <Text size="sm" c="red" mt="xs">{error}</Text>
      )}

      {value.length > 0 && (
        <Stack gap="xs" mt="md">
          {value.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                {getFileIcon(file.name)}
                <div style={{ overflow: 'hidden' }}>
                  <Text size="sm" fw={500} lineClamp={1}>{file.name}</Text>
                  <Text size="xs" c="dimmed">{formatFileSize(file.size)}</Text>
                </div>
              </div>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => handleRemove(index)}
                style={{ padding: 4, minWidth: 'auto' }}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </Stack>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

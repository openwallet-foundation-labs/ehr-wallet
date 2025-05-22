/**
 * Converts an array of objects to a CSV string.
 * @param data - The array of objects to convert.
 * @param columns - Optional array of column headers. If not provided, keys from the first object are used.
 * @returns A CSV formatted string.
 */
export function convertToCSV(data: any[], columns?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const columnHeaders = columns || Object.keys(data[0]);

  const escapeCSVField = (field: any): string => {
    if (field === null || typeof field === 'undefined') {
      return '';
    }
    const stringField = String(field);
    // If the field contains a comma, newline, or double quote, enclose it in double quotes
    // and escape any existing double quotes by doubling them.
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const headerRow = columnHeaders.map(escapeCSVField).join(',');
  
  const dataRows = data.map(row => {
    return columnHeaders.map(header => {
      return escapeCSVField(row[header]);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download for the given content.
 * @param filename - The desired name for the downloaded file.
 * @param content - The content to download (e.g., CSV string).
 * @param contentType - The MIME type of the content (defaults to 'text/csv;charset=utf-8;').
 */
export function downloadFile(filename: string, content: string, contentType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Custom format: e.g. "Jun 12, 2026" or "12 Jun 2026"
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatCurrencyWithoutSymbol = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

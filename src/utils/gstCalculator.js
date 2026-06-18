export const calculateGST = (baseAmountStr, gstRateStr) => {
  const base = parseFloat(baseAmountStr) || 0;
  const rate = parseFloat(gstRateStr) || 0;
  
  const gstAmount = base * (rate / 100);
  const total = base + gstAmount;
  
  return {
    baseAmount: base,
    gstRate: rate,
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

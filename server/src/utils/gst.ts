export const calculateGST = (base: number, percent: number) => {
  const baseNum = Number(base) || 0;
  const percentNum = Number(percent) || 0;

  const gstAmount = parseFloat((baseNum * (percentNum / 100)).toFixed(2));
  const totalAmount = parseFloat((baseNum + gstAmount).toFixed(2));

  return {
    gstAmount,
    totalAmount
  };
};

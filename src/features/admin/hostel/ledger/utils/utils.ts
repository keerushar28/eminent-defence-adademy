export const formatCurrency = (amount: number) => {
  return `NPR ${amount.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

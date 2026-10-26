const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// Amounts come from the API as fixed-point strings ("120.00").
export const formatMoney = (amount: string | number) =>
  peso.format(Number(amount));

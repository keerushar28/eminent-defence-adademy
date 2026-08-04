import NepaliDate from "nepali-date-converter";

// Helper function to format date - converts AD to BS
export const convertAdToBs = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  try {
    const nepaliDate = new NepaliDate(dateObj);
    return nepaliDate.format("DD MMMM YYYY");
  } catch {
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};

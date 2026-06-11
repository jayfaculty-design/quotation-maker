// src/lib/numberToWords.ts

const ones = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];
const tens = [
  "",
  "",
  "TWENTY",
  "THIRTY",
  "FORTY",
  "FIFTY",
  "SIXTY",
  "SEVENTY",
  "EIGHTY",
  "NINETY",
];
const scales = ["", "THOUSAND", "MILLION", "BILLION"];

function convertLessThanOneThousand(num: number): string {
  let words = "";
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + " HUNDRED ";
    num %= 100;
    if (num > 0) words += "AND ";
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    words += ones[num] + " ";
  }
  return words.trim();
}

export function convertAmountToWords(amount: number): string {
  if (amount === 0) return "ZERO GHANA CEDIS ONLY";

  const mainPart = Math.floor(amount);
  const pesewasPart = Math.round((amount - mainPart) * 100);

  let currentScale = 0;
  let mainWords = "";
  let tempNumber = mainPart;

  while (tempNumber > 0) {
    const chunk = tempNumber % 1000;
    if (chunk > 0) {
      const chunkWords = convertLessThanOneThousand(chunk);
      mainWords = chunkWords + " " + scales[currentScale] + " " + mainWords;
    }
    tempNumber = Math.floor(tempNumber / 1000);
    currentScale++;
  }

  mainWords = mainWords.trim() + " GHANA CEDIS";

  if (pesewasPart > 0) {
    const pesewasWords = convertLessThanOneThousand(pesewasPart);
    mainWords += " AND " + pesewasWords + " PESEWAS";
  }

  return mainWords.trim() + " ONLY";
}

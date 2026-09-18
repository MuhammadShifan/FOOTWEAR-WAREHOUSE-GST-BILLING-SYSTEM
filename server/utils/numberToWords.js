/**
 * Converts a numeric amount to Indian Rupee Words format
 * e.g., 16330.50 -> "Rupees Sixteen Thousand Three Hundred Thirty and Fifty Paise Only"
 */

const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const tensMultiple = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n) {
  let str = '';
  if (n >= 100) {
    str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 10 && n <= 19) {
    str += twoDigits[n - 10] + ' ';
  } else if (n >= 20) {
    str += tensMultiple[Math.floor(n / 10)] + ' ';
    if (n % 10 > 0) {
      str += singleDigits[n % 10] + ' ';
    }
  } else if (n > 0) {
    str += singleDigits[n] + ' ';
  }
  return str.trim();
}

export function numberToWordsRupees(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rupees Zero Only';
  }

  const num = Math.abs(Number(amount));
  if (num === 0) return 'Rupees Zero Only';

  const parts = num.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let result = '';

  // Crores
  if (integerPart >= 10000000) {
    const crore = Math.floor(integerPart / 10000000);
    result += convertBelowThousand(crore) + ' Crore ';
    integerPart %= 10000000;
  }

  // Lakhs
  if (integerPart >= 100000) {
    const lakh = Math.floor(integerPart / 100000);
    result += convertBelowThousand(lakh) + ' Lakh ';
    integerPart %= 100000;
  }

  // Thousands
  if (integerPart >= 1000) {
    const thousand = Math.floor(integerPart / 1000);
    result += convertBelowThousand(thousand) + ' Thousand ';
    integerPart %= 1000;
  }

  // Hundreds & Units
  if (integerPart > 0) {
    result += convertBelowThousand(integerPart) + ' ';
  }

  result = result.trim();
  let finalString = result ? `Rupees ${result}` : 'Rupees Zero';

  if (decimalPart > 0) {
    finalString += ` and ${convertBelowThousand(decimalPart)} Paise`;
  }

  finalString += ' Only';
  return finalString.replace(/\s+/g, ' ');
}

export default numberToWordsRupees;

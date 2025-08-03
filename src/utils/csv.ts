// Known issue: characters between commas but outside quotes are ignored when reading CSV
// Ex: The line `123,4"5"6,789` is read as `['123', '5', '789']`

// Read from a CSV string to a 2D array
function fromCSV(csv: string) {
  csv = csv.trim() + '\n';

  const output = [];
  let row = [];

  let openingQuote = false; // encountered opening quote of token
  let closingQuote = false; // encountered closing quote of token
  let escapeNext = false; // if the next quote should be escaped
  let start = 0; // starting index of token (inclusive)
  let end = 0; // ending index of a token (non-inclusive)

  for (let i=0; i<csv.length; i++) {

    // Check for quotes
    if (csv[i] === '"') {
      if (openingQuote) {
        // If quote encountered, escape next char if it's also a quote
        escapeNext = true;
      } else {
        // First quote character found is the opening quote
        start = i+1;
        openingQuote = true;
      }
    } else if (escapeNext) {
      // If previous character was a quote but not this one,
      // it must have been the closing quote
      end = i-1;
      closingQuote = true;
      escapeNext = false;
    }

    // Check for unquoted delimiter characters
    if (openingQuote === closingQuote) {

      // Add token to row for comma
      if (csv[i] === ',') {
        const len = closingQuote ? end-start : i-start;
        const token = csv.substr(start, len).replaceAll('""','"')
        row.push(token);

        openingQuote = false;
        closingQuote = false;
        start = i+1;
      }

      // Add token and row for newline
      if (csv[i] === '\n') {
        const len = closingQuote ? end-start : i-start;
        const token = csv.substr(start, len).replaceAll('""','"')
        row.push(token);

        output.push(row);
        row = [];

        openingQuote = false;
        closingQuote = false;
        start = i+1;
      }
    }
  }

  return output;
}

// Convert a 2D array to a CSV string
function toCSV(data: any[][]) {
  return data.map(row => 
    row.map(ele => {
      ele = String(ele);
      if (/[\s,"]/.test(ele))
        return `"${ele.replaceAll('"','""')}"`
      return ele;
    })
  ).join('\n')
}

export { fromCSV, toCSV };
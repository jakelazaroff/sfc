/** @type {string} str */
export function dedent(str) {
  const lines = str.split("\n");

  let ws = Infinity;
  for (const line of lines.filter(line => !!line.trim())) {
    ws = Math.min(ws, line.search(/[^\s]/));
  }

  return lines.map(line => line.slice(ws).trimEnd()).join("\n");
}

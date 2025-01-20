export function indent(str: string, spaces = 0) {
  return str
    .split("\n")
    .filter(line => !!line.trim())
    .map(line => " ".repeat(spaces) + line)
    .join("\n");
}

export function dedent(str: string) {
  const lines = str.split("\n");

  let ws = Infinity;
  for (const line of lines.filter(line => !!line.trim())) {
    ws = Math.min(ws, line.search(/[^\s]/));
  }

  return lines.map(line => line.slice(ws).trimEnd()).join("\n");
}

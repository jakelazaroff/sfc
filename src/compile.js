import { walk } from "estree-walker";
import { parse } from "svelte/compiler";

/**
 * @param {string} source
 */
export function compile(source) {
  const ast = parse(source, { modern: true });

  /** @type {string[]} Top-level module imports */
  const imports = [];
  /** @type {string[]} Top-level module body */
  const top = [];
  /** @type {string[]} Component function body */
  const instance = [];
  /** @type {string[]} Component function JSX */
  const html = [];
  /** @type {string[]} CSS*/
  const styles = [];

  for (const stmt of ast.module?.content.body ?? []) {
    const code = source.slice(stmt.start, stmt.end);
    if (stmt.type === "ImportDeclaration") imports.push(code);
    else top.push(code);
  }

  for (const stmt of ast.instance?.content.body ?? []) {
    const code = source.slice(stmt.start, stmt.end);
    if (stmt.type === "ImportDeclaration") imports.push(code);
    else instance.push(code);
  }

  for (const el of ast.fragment.nodes) {
    if (/^\s+$/.test(el.data) && !html.length) continue;
    const code = source.slice(el.start, el.end);
    html.push(code);
  }

  styles.push(ast.css?.content.styles);

  if (imports.length) imports.push("");
  if (top.length) top.push("");
  if (instance.length) instance.push("");

  const js = [
    ...imports,
    ...top,
    "export default function(props) {",
    ...instance.map(stmt => `  ${stmt}`),
    "  return (",
    "    <>",
    ...html.map(el => `      ${el}`),
    "    </>",
    "  );",
    "}",
    "",
  ].join("\n");

  const css = styles.join("\n");

  return { js, css };
}

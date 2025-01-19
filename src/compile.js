import { walk } from "estree-walker";
import { parse } from "svelte/compiler";

import { dedent } from "./util.js";

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
  let html = "";
  let css = "";

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

  walk(ast.fragment, {
    enter(node, parent, key, index) {
      switch (node.type) {
        case "ExpressionTag":
          html += "{";
          break;

        case "Identifier":
          html += node.name;
          break;

        case "Text":
          if (parent.type === "Attribute") break;
          html += node.data;
          break;

        case "RegularElement": {
          let attributes = node.attributes
            .map(attr => {
              if (!attr.value.length) return attr.name;
              return `${attr.name}="${attr.value.map(v => v.data).join("")}"`;
            })
            .join(" ");
          if (attributes) attributes += " ";

          html += `<${node.name}${attributes}>`;
          break;
        }

        default:
        // console.log(node.type);
      }
    },
    leave(node) {
      switch (node.type) {
        case "RegularElement":
          html += `</${node.name}>`;
          break;

        case "ExpressionTag":
          html += "}";
          break;
      }
    },
  });

  if (ast.css) css = dedent(ast.css.content.styles).trim();

  if (imports.length) imports.push("");
  if (top.length) top.push("");
  if (instance.length) instance.push("");

  const js = [
    ...imports,
    ...top,
    "export default function(props) {",
    ...instance.map(stmt => `  ${stmt}`.trimEnd()),
    "  return (",
    "    <>",
    html
      .split("\n")
      .filter(l => !!l.trim())
      .map(l => `      ${l}`)
      .join("\n"),
    "    </>",
    "  );",
    "}",
  ].join("\n");

  return { js, css };
}

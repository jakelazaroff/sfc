import { type Node, parse as parseHtml } from "@astrojs/compiler";
import { is, serialize } from "@astrojs/compiler/utils";
import { transform as walkCss } from "lightningcss";
import { parseAsync as parseTsx } from "oxc-parser";

import { dedent, indent } from "./util";

type Span = { text: string };

interface Options {
  scope?: boolean;
  id?: string;
}

function walk(node: Node, cb: (node: Node) => void) {
  cb(node);

  if (!is.parent(node)) return;
  for (const child of node.children) {
    walk(child, cb);
  }
}

export async function compile(source: string, options: Options = {}) {
  const { scope = false, id = Math.random().toString(16).slice(8) } = options;

  const html = await parseHtml(source, { position: true });

  const spans = {
    imports: [] as Span[],
    module: [] as Span[],
    body: [] as Span[],
    template: [] as Span[],
    styles: [] as Span[],
  };

  for (const el of html.ast.children) {
    if (!is.element(el)) continue;
    if (el.name === "script") continue;
    if (el.name === "style") continue;

    if (scope) {
      walk(el, node => {
        if (!is.element(node)) return;

        node.attributes.unshift({
          type: "attribute",
          name: "data-sfc-id-" + id,
          kind: "empty",
          value: "",
        });
      });
    }

    const text = serialize(el, { selfClose: true });
    spans.template.push({ text });
  }

  const scripts = html.ast.children.filter(el => is.element(el)).filter(el => el.name === "script");
  for (const { children, attributes } of scripts) {
    const code = children[0];
    if (!is.text(code)) continue;

    const isModule = attributes.some(attr => attr.name === "module");

    const offset = code.position!.start.offset;
    const tsx = await parseTsx("foo.tsx", code.value, { sourceType: "module", lang: "tsx" });
    for (const stmt of tsx.program.body) {
      const text = source.slice(offset + stmt.start, offset + stmt.end);
      const span = { text };

      if (stmt.type === "ImportDeclaration") spans.imports.push(span);
      else if (isModule) spans.module.push(span);
      else spans.body.push(span);
    }
  }

  const styles = html.ast.children.filter(el => is.element(el)).filter(el => el.name === "style");
  for (const style of styles.map(style => style.children[0])) {
    if (!is.text(style)) continue;

    let code = style.value.slice(1, -1);
    if (scope) {
      const result = walkCss({
        filename: "foo.css",
        code: Buffer.from(style.value),
        visitor: {
          Selector(selector) {
            return [...selector, { type: "attribute", name: "data-sfc-id-" + id }];
          },
        },
      });

      code = result.code.toString();
    }

    spans.styles.push({ text: code });
  }

  let js = "";

  for (const { text } of spans.imports) js += text + "\n";
  if (spans.imports.length) js += "\n";

  for (const { text } of spans.module) js += text + "\n";
  if (spans.module.length) js += "\n";

  js += "export default function(props) {" + "\n";

  for (const { text } of spans.body) js += "  " + text + "\n";
  if (spans.body.length) js += "\n";

  js += "  return (\n";
  js += "    <>\n";

  for (const { text } of spans.template) {
    js += indent(text, 6) + "\n";
  }

  js += "    </>\n";
  js += "  );\n";
  js += "}\n";

  let css = "";

  for (const { text } of spans.styles) css += dedent(text);

  return { js, css };
}

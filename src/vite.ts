import path from "node:path";

import { compile } from "./compile";

interface Options {
  extension?: string;
}

export default function sfc(options: Options = {}) {
  const { extension = ".sfc" } = options;

  const jsx = new Map<string, string>();
  const css = new Map<string, string>();

  const prefix = "virtual:sfc";

  return {
    name: "vite-plugin-sfc",
    enforce: "pre",

    resolveId(id: string, importer = "") {
      if (id.startsWith(prefix)) return id;

      // handle relative imports within the virtual file
      if (importer.startsWith(prefix) && id.startsWith(".")) {
        const dir = path.dirname(importer.slice(prefix.length));
        return path.resolve(dir, id);
      }

      return null;
    },

    load(id: string) {
      if (!id.startsWith(prefix)) return null;

      // handle virtual CSS modules
      const path = id.slice(prefix.length, -4);

      switch (id.slice(-4)) {
        case ".css":
          return css.get(path) || null;
        case ".jsx":
          return jsx.get(path) || null;
      }
    },

    async transform(source: string, id: string) {
      // only transform files with the specified extension
      if (!id.endsWith(extension)) return null;

      try {
        // parse the content
        const output = await compile(source);

        let code = "";

        // store JSX in the virtual module map
        jsx.set(id, output.js);
        code += `export * from "${prefix + id}.jsx";\n`;
        code += `export { default } from "${prefix + id}.jsx";\n`;

        // store CSS in the virtual module map
        if (output.css) {
          css.set(id, output.css);
          code += `import "${prefix + id}.css";\n`;
        }

        return { code, map: null };
      } catch (error) {
        console.error(`Error processing ${id}: ${error}`);
        return null;
      }
    },
  };
}

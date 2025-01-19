import path from "node:path";

import { compile } from "./compile.js";

export default function sfc(options = {}) {
  const { extension = ".sfc" } = options;

  // keep track of CSS contents for virtual modules
  /** @type {Map<string, string>} */
  const css = new Map();

  // keep track of JSX contents for virtual modules
  /** @type {Map<string, string>} */
  const jsx = new Map();

  const prefix = "virtual:sfc";

  return {
    name: "vite-plugin-sfc",

    /** @type {"pre"} */
    enforce: "pre",

    /**
     * @param {string} id
     * @param {string?} [importer]
     */
    resolveId(id, importer = "") {
      if (id.startsWith(prefix)) return id;

      // handle relative imports within the virtual file
      if (importer.startsWith(prefix) && id.startsWith(".")) {
        const dir = path.dirname(importer.slice(prefix.length));
        return path.resolve(dir, id);
      }

      return null;
    },

    /**
     * @param {string} id
     */
    load(id) {
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

    /**
     * @param {string} source
     * @param {string} id
     */
    transform(source, id) {
      // only transform files with the specified extension
      if (!id.endsWith(extension)) return null;

      try {
        // parse the content
        const output = compile(source);

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
        this.error(`Error processing ${id}: ${error}`);
        return null;
      }
    },
  };
}

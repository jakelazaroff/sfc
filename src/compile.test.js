import { describe, expect, test } from "vitest";

import { compile } from "./compile.js";
import { dedent } from "./util.js";

describe("compile", () => {
  test("only markup", () => {
    const source = dedent(`<div>hello, world!</div>`);
    const output = dedent(`
      export default function(props) {
        return (
          <>
            <div>hello, world!</div>
          </>
        );
      }
    `).trim();

    expect(output).toBe(compile(source).js);
  });

  test("markup and component body", () => {
    const source = dedent(`
      <script>
        let name = "jake";
      </script>
      <div>hello, {name}!</div>
    `);
    const output = dedent(`
      export default function(props) {
        let name = "jake";

        return (
          <>
            <div>hello, {name}!</div>
          </>
        );
      }`).trim();

    expect(output).toBe(compile(source).js);
  });

  test("imports, markup and component body", () => {
    const source = dedent(`
      <script>
        import foo from "bar";
        let name = "jake";
      </script>
      <div>hello, {name}!</div>
    `);
    const output = dedent(`
      import foo from "bar";

      export default function(props) {
        let name = "jake";

        return (
          <>
            <div>hello, {name}!</div>
          </>
        );
      }`).trim();

    expect(output).toBe(compile(source).js);
  });

  test("module script", () => {
    const source = dedent(`
      <script module>
        import foo from "bar";
        let name = "jake";
      </script>
      <div>hello, {name}!</div>
    `);
    const output = dedent(`
      import foo from "bar";

      let name = "jake";

      export default function(props) {
        return (
          <>
            <div>hello, {name}!</div>
          </>
        );
      }`).trim();

    expect(output).toBe(compile(source).js);
  });

  test("styles", () => {
    const source = dedent(`
      <style>
        .foo {
          color: red;
        }
      </style>
    `);
    const output = dedent(`
      .foo {
        color: red;
      }
    `).trim();

    expect(output).toBe(compile(source).css);
  });
});

import { describe, expect, test } from "vitest";

import { compile } from "./compile";
import { dedent } from "./util";

describe("compile", () => {
  test("only markup", async () => {
    const source = dedent(`
      <p>hello, world!</p>
    `);

    const output =
      dedent(`
      export default function(props) {
        return (
          <p>hello, world!</p>
        );
      }
    `).trim() + "\n";

    expect((await compile(source)).js).toBe(output);
  });

  test("components", async () => {
    const source = dedent(`
      <Heading>greetings!</Heading>
      <p>hello, world!</p>
    `);

    const output =
      dedent(`
      export default function(props) {
        return (
          <>
            <Heading>greetings!</Heading>
            <p>hello, world!</p>
          </>
        );
      }
    `).trim() + "\n";

    expect((await compile(source)).js).toBe(output);
  });

  test("markup and component body", async () => {
    const source = dedent(`
      <script>
        let name = "jake";
      </script>
      <p>hello, {name}!</p>
    `);

    const output =
      dedent(`
      export default function(props) {
        let name = "jake";

        return (
          <p>hello, {name}!</p>
        );
      }`).trim() + "\n";

    expect((await compile(source)).js).toBe(output);
  });

  test("imports, markup and component body", async () => {
    const source = dedent(`
      <script>
        import foo from "bar";
        // test
        let name = "jake";
      </script>
      <!-- hi -->
      <p>hello, {name}!</p>
    `);

    const output =
      dedent(`
      import foo from "bar";

      export default function(props) {
        let name = "jake";

        return (
          <p>hello, {name}!</p>
        );
      }`).trim() + "\n";

    expect((await compile(source)).js).toBe(output);
  });

  test("module script", async () => {
    const source = dedent(`
      <script module>
        import foo from "bar";
        let name = "jake";
      </script>
      <p>hello, {name}!</p>
    `);

    const output =
      dedent(`
      import foo from "bar";

      let name = "jake";

      export default function(props) {
        return (
          <p>hello, {name}!</p>
        );
      }`).trim() + "\n";

    expect((await compile(source)).js).toBe(output);
  });

  test("styles", async () => {
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
      }`).trim();

    expect((await compile(source)).css).toBe(output);
  });

  test("scoped styles", async () => {
    const source = dedent(`
      <p class="foo">hello world!</p>
      <style>
        .foo {
          color: red;
        }
      </style>
    `);

    const js =
      dedent(`
      export default function(props) {
        return (
          <p data-sfc-id-asdf class="foo">hello world!</p>
        );
      }
    `).trim() + "\n";

    const css =
      dedent(`
      .foo[data-sfc-id-asdf] {
        color: red;
      }
    `).trim() + "\n";

    const output = await compile(source, { scope: true, id: "asdf" });

    expect(output.js).toBe(js);
    expect(output.css).toBe(css);
  });
});

import { compile } from "./compile.js";

const source = `
<div>
  <h1>hello, world!</h1>
</div>
<p>test</p>
<style>
h1 { color: red; }
</style>
`.trim();

console.log(compile(source));

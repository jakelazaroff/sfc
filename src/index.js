import { compile } from "./compile.js";

const source = `
<h1>hello, world!</h1>
<style>
h1 { color: red; }
</style>
`.trim();

console.log(compile(source));

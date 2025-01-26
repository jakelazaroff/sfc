# SFC

Svelte- and Astro-style single-file components for your favorite framework.

SFC compiles single-file components into plain JSX and CSS:

**Input:**

```svelte
<script>
  import { createSignal } from "solid-js";

  const [count, setCount] = createSignal(0);
</script>

<button class="counter" onClick={() => setCount(count => count + 1)}>
  count is {count()}
</button>

<style>
  .counter {
    color: red;
  }
</style>
```

**Output:**

```jsx
import { createSignal } from "solid-js";

export default function (props) {
  const [count, setCount] = createSignal(0);

  return (
    <button data-sfc-id-8b8e4f5 class="counter" onClick={() => setCount(count => count + 1)}>
      count is {count()}
    </button>
  );
}
```

```css
.counter[data-sfc-id-8b8e4f5] {
  color: red;
}
```

## Why?

Short story: Svelte and Astro are awesome, and I missed the DX when using other frameworks.

- **No toolchain changes.** SFC can be used as a Vite plugin in your existing build system.
- **No runtime cost.** SFC components are compiled at build time into native components for your framework.
- **No lock-in.** If you decide you don't like SFC, run it on your source files to get the code you would have written anyway.

## Todo

- [ ] auto reloading with Vite
- [ ] props and prop type definitions
- [ ] generics
- [ ] subcomponents
- [ ] source maps

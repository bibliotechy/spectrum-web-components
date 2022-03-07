---
layout: dev-mode.njk
title: 'Dev mode: Spectrum Web Components'
displayName: Dev mode
slug: dev-mode
---

# Dev mode

Spectrum Web Components aims to support you in making high quality application by taking into account features of our components, like accessibility, connectivity, interactivity, etc, that would otherwise distract you from working on what makes you work unique. While many of these capabilities can exist wholey at runtime in their encapsulated custom element delivery, some require development time conciderations to ensure they are surfaced correctly. Code checks for these realities can be costly, and require KBs of javascript that your consumers will never need in production. With this in mind, we package these extended capbilities into a dev mode. With the dev mode turned on, you can confirm that your consumption of Spectrum Web Components is adhereing to best practices around accessibility, API usage, code deprecations, performance, and more.

## Activation

Dev mode can be accessed via the `development` [export condition](https://nodejs.org/api/packages.html#conditional-exports). Each tooling pipeline allows for this condition to be applied in its own way. With [Rollup](https://rollupjs.org/guide/en/), for example, use the [`nodeResolve()` plugin](https://www.npmjs.com/package/@rollup/plugin-node-resolve) to make choices about what export conditions to follow like so:

```js
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    // ...
    plugins: [
        nodeResolve({
            // Add this line for development config, omit for production config
            exportConditions: ['development'],
        }),
    ],
};
```

Assuming you're already consuming Spectrum Web Component APIs perfectly, you'll be greated with the following message to announce that dev mode has been activated:

```
Spectrum Web Components is in dev mode. Not recommended for production!

https://opensource.adobe.com/spectrum-web-components/dev-mode/
```

## Configuration

You can customize the messages that you receive in your application by turning off warning that you no longer believe apply to your application. This can be done by element "localName", warning "type", or warning "level". To configure this, apply a value for `window.__swc` in your JS before you import the rest of your components.

```js
<script>
window.__swc = {
    ignoreWarningTypes: Record<WarningType, boolean>;
    ignoreWarningLevels: Record<WarningLevel, boolean>;
    ignoreWarningLocalNames: Record<string, boolean>;
}
</script>

<script
    src="./path/to/app.js"
    type="module"
></script>
```

This leverages the following types:

```ts
// the element tag name
type ElementLocalName = string;

type WarningType = 'default' | 'accessibility' | 'api';

type WarningLevel = 'default' | 'low' | 'medium' | 'heigh' | 'deprecation';
```

With this you could turn warnings off for `sp-button`, `api`s, and `deprecation`s with the following config:

```js
window.__swc = {
    ignoreWarningTypes: { 'sp-button': true };
    ignoreWarningLevels: { 'api': true };
    ignoreWarningLocalNames: { 'deprecation': true };
}
```

## Future

While there are currently only a handful of warnings that will be published from the library in this way, look for usage of this feature to expand in the coming months and years. As you consume Spectrum Web Components into your projects, if you find concepts or features that you feel would be well supported by messages in this way, please [join the discussion](https://github.com/adobe/spectrum-web-components/discussions/2308) and support us in making the library as productive for you as possible.

Dev mode should not be delivered to your users in production. This is why it has been added as an opt-in feature of the Spectrum Web Components library. With this in mind, there is the possibility that breaking changes to the dev mode API could occur outside of breaking changes to in semver for library or the packages emmiting those dev mode messages. To avoid these breaks effecting your code, do NOT leverage API beyond the `ignoreWarningTypes`, `ignoreWarningLevels`, and `ignoreWarningLocalNames` properies on the `__swc` object listed above.

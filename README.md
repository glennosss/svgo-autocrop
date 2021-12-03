
# svgo-autocrop

Plugin which can be added to [svgo](https://github.com/svg/svgo).

Reduces viewBox to minimum possible size so no wasted transparent space around svg.

**Example Input**
```
<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
   <rect x="5" y="5" width="10" height="10" fill="#000"/>
</svg>
```

**Example Output**
```
<svg viewBox="5 5 10 10" xmlns="http://www.w3.org/2000/svg">
   <rect x="5" y="5" width="10" height="10" fill="#000"/>
</svg>
```

**Example Commands/Config**

See [index.js](index.js) and [AutocropUtils.js](lib/AutocropUtils.js) for quick walkthrough of supported parameters.

See [example-config.js](example-config.js) config;
> svgo --input 'input.svg' --output 'output.svg' --config '[example-config.js](example-config.js)'

See [example-config-debug.js](example-config-debug.js) config;
> svgo --input 'input.svg' --output 'output.svg' --config '[example-config-debug.js](example-config-debug.js)'


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
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
   <rect x="0" y="0" width="10" height="10" fill="#000"/>
</svg>
```

## Parameters

| Parameter                       | Default     | Recommended | Description |
| ------------------------------- | ----------- | ----------- | ------------|
| includeWidthAndHeightAttributes | undefined   | false       | If undefined, only updated width/height if SVG already has width/height (this is the default). If true, writes width/height. If false, deletes width/height (which we recommend so your SVG always scales) |
| padding                         | undefined   | undefined   | Either number, object defining {top, bottom, left, right} or function accepting the parameters (viewboxNew, viewbox?, ast?, params?, info?) where viewboxNew should be updated with the required padding. We don't recommend specifying padding on your SVG - padding should be defined in your css. |
| removeClass                     | undefined/false | Depends on svgs | Removes 'class' attribute if encountered. Good for bootstrap svgs which unnecessarily include the svg name in the class. |
| disableTranslate                | undefined   | undefined   | Don't attempt to translate back to (0, 0) if not already (0,0). This can be safely left enabled, but added just in case someone needs it. |
| disableTranslateWarning         | undefined   | Set to 'true' if the warning becomes annoying | Disable warning when translation back to (0, 0) fails. If this warning is annoying you, just set this to true. |
| debug                           | undefined   | undefined   | Log old/new viewbox to console |
| debugWriteFiles                 | undefined   | undefined   | Writes "${srcSvg}.png" and "${srcSvg}.html" file to disk for easier debugging. FYI Setting this to true is an easy way to convert all your SVGs to PNGs. |
| debugWorkerThread               | undefined   | undefined   | Log all worker thread communication. Warning: have to manually terminate terminate application when this is true. |

Based off the above, your parameters should typically be `{}` or `{includeWidthAndHeightAttributes: false}`.

## Example config

See [example-config.js](example-config.js) config.

Then run with svgo;
> svgo --input 'input.svg' --output 'output.svg' --config '[example-config.js](example-config.js)'

## Plugin walkthrough

See [index.js](index.js) and [AutocropUtils.js](lib/AutocropUtils.js) for starting points.

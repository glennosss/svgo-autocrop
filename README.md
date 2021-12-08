
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

**Example Output if using {setColor: 'currentColor'} as parameters**
```
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
   <rect x="0" y="0" width="10" height="10" fill="currentColor"/>
</svg>
```

## Parameters

| Parameter                       | Default     | Recommended | Description |
| ------------------------------- | ----------- | ----------- | ------------|
| autocrop                        | true        | true        | Disable auto cropping. Useful if you only want to use the `removeClass` or `setColor` functionality described below. |
| includeWidthAndHeightAttributes | undefined   | false       | If undefined, only updated width/height if SVG already has width/height (this is the default). If true, writes width/height. If false, deletes width/height (which we recommend so your SVG always scales). If true, you should also disable svgo's default 'removeViewBox' plugin and optionally enable svgo's 'removeDimensions' plugin - see [example-config.js](example-config.js) below for how to do this. |
| padding                         | undefined   | undefined   | Either number, object defining {top, bottom, left, right} or function accepting the parameters (viewboxNew, viewbox?, ast?, params?, info?) where viewboxNew should be updated with the required padding. We don't recommend specifying padding on your SVG - padding should be defined in your css. |
| removeClass                     | false       | true (typically can be safely set to true) | Removes 'class' attribute if encountered. Good for bootstrap svgs which unnecessarily include the svg name in the class. |
| removeDeprecated                | false       | true           | If true, then deletes <svg version/baseProfile> attributes. Also deletes other non-standard/not useful attributes like 'sketch:type'/'data-name'/etc. |
| setColor                        | undefined   | "currentColor" | Replace all colors with color specified. Usually set to 'currentColor' so color is inherited/easily modifiable from html/css. If multiple colors are encountered, how this is handled is defined by the 'setColorIssue' property. |
| setColorIssue                   | 'warn'      | 'warn' or 'fail'  | Defines the action to take when 'setColor' is set and multiple colors are encountered. If 'warn', then a warning is outputted to the console that your <svg> will be converted from a multicolor/multitone <svg> to a single color/monotune <svg> using the 'setColor' specified. If 'fail', then an error is thrown instead of being logged as a warning. If 'rollback', then <svg> is still autocropped but translate back to (0,0)/'removeClass'/'setColor' will be undone/rolled back. If 'ignore', then all colors are changed to the 'setColor' specified without any warnings/errors. |
| disableTranslate                | false       | false       | Don't attempt to translate back to (0, 0) if not already (0,0). This can be safely left enabled, but added just in case someone needs it. |
| disableTranslateWarning         | false       | Set to 'true' if the warning becomes annoying | Disable warning when translation back to (0, 0) fails. If this warning is annoying you, just set this to true. |
| debug                           | false       | false       | Log old/new viewbox to console |
| debugWriteFiles                 | false       | false       | If true, then writes "${srcSvg}.png" and "${srcSvg}.html" file to disk for easier debugging. If string, then then writes "${debugWriteFiles}.png" and "${debugWriteFiles}.html" file to disk for easier debugging. FYI Setting this to true is an easy way to convert all your SVGs to PNGs. |
| debugWorkerThread               | false       | false       | Log all worker thread communication. Warning: have to manually terminate terminate application when this is true. |

Based off the above, your parameters should typically be `{}` or `{includeWidthAndHeightAttributes: false}` or something like `{includeWidthAndHeightAttributes: false, removeClass: true, removeDeprecated: true, setColor: 'currentColor', setColorIssue: 'fail'}`.

## Example config

See [example-config.js](example-config.js) config.

Then run with svgo;
> svgo --input 'input.svg' --output 'output.svg' --config '[example-config.js](example-config.js)'

## Plugin walkthrough

See [index.js](index.js) and [AutocropUtils.js](lib/AutocropUtils.js) for starting points.

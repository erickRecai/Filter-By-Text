# Filter-By-Text
A userscript that replaces words on various sites using regular expression rules.
A bit of tinkering is needed to enable element deletion, lowlighting, and highlighting.

# Installation
Chrome:  
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en  
Firefox:  
https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/

# Replace Examples
### Basic Text Replace
![Example 1](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/aa.%20basic%20replace.png)
### Replacing all Characters
![Example 2](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/ab.%20replace%20all%20characters.png)
### Replacing each text instance
![Example 3](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/ac.%20replace%20by%20text.png)

# Enabling Deletion, Lowlighting and Highlighting
### Identify the parent blocks
It helps to use an CSS extension to apply a simple CSS rule to identify a good class value to use.
Here, the class I use is <code>public</code>.

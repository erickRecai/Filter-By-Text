# Filter-By-Text
A userscript that replaces words on various sites using regular expression rules.
A bit of tinkering is needed to enable element deletion, lowlighting, and highlighting.

# Installation
Requires a browser extension that enables userscripts to install this userscript. I personally use Tampermonkey but other extensions should work as well.  
Chrome:  
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en  
Firefox:  
https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/  
To install this script specifically, just the <code>user.js</code> file needs to downloaded.

# Replace Examples
### Basic Text Replace
![Basic Text Replace](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/aa.%20basic%20replace.png)
### Replacing all Characters
![Replacing all Characters](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/ab.%20replace%20all%20characters.png)
### Replacing each text instance
![Replacing each text instance](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/ac.%20replace%20by%20text.png)

# Enabling Deletion, Lowlighting and Highlighting
### Identifying the parent blocks
It helps to use an CSS extension to apply a simple CSS rule to identify a good class value to use.
Here, the class I use is <code>public</code> which I add a thin red border to all elements with that class.
![Identifying the parent blocks](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/ba.%20borders.png)
### Example for each filter rule
![Example for each filter rule](https://github.com/erickRecai/Filter-By-Text/blob/Filter-by-Text/examples/bb.%20highlight%20lowlight%20example.png)
And you can simply disable or delete the css rule created to find the parent blocks afterwards.  
* Sites may change how they structure their site so if custom filtering ever stops, it may be due to a change on the site itself.
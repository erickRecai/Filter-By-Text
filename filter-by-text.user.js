// ==UserScript==
// @name         Filter by Text
// @namespace    https://github.com/erickRecai
// @version      1.4.1
// @description  Replaces text with other text. Can also delete, highlight, and lowlight elements.
// @author       guyRicky

// @match        *://*/*
// @noframes

// @exclude      *://docs.google.com/*
// @exclude      *://mail.google.com/*

// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://greasyfork.org/scripts/381859-waitforkeyelements-by-brocka/code/WaitForKeyElements%20by%20BrockA.js?version=689364

// @licence      CC-BY-NC-SA-4.0; https://creativecommons.org/licenses/by-nc-sa/4.0/
// @licence      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==
/*jshint esversion: 6*/


(function () {
    'use strict';

    if (0) {/*
        == issues ==
        - certain text nodes aren't accessed with markCheckedElement enabled. (multiple text nodes)
        
        == how it works ==
        - calls replaceText() once for each major run.
        - visits each text node and checks them against each and every rule.
        - if the replacing text is special, more things are done to the text node.
        - the css for highlight and lowlight need to be set manually.
        - lowlight2 and highlight1 matches don't change text.
        
        == organization ==
        AA. basic replace rules
        AB. special rules
        AC. site selectors
        BA. script options
        CA. filter code
        CB. replaceText()
        CC. support functions
        DA. script button
        DB. lowlight/highlight css
    */}

    const showLogMessages = 1; // default 0; set to 1 to show console messages.
    /*
        ## current message tags ##
        ## selects which messages are logged to console if enabled ##
        TT-MA // page title rule matches
        MA // any rule matches
        DL-MA|LL1-MA|LL2-MA|HL1-MA // specific rule matches
        CH-TT
        SYS // general system messages
        1 // high priority messages
    */
    const enabledMessages = /TT-LG|DL|CA|LL|SYS|^1/;
    consolelog("#### (FBT) text replace script began. ####");

    // ==== AA. basic replace rules ===============================================================|

    if (0){ /*
        == regex special classes ==
        [^abc] any character that isn't 'a', 'b', or 'c'
        \w == [a-zA-Z0-9_]
        \W == [^a-zA-Z0-9_]
        \d == [0-9]
    
        [\W_]?
        - word seperators
    
        lookbehind: (?<!a)b
        - b not followed by a
        negative lookahead: a(?!b)
        - a not followed by b
    */}

    let replaceRules = [
        [/regex expression1/,"new text"],
        [/regex expression1/,"new text2"],
    ];

    /*
    could define rules in a seperate script for example:
    seperate script:
    unsafeWindow.externalRules = [["some text","some text"]];

    referencing those rules in this script:
    replaceRules = replaceRules.concat(unsafeWindow.externalRules);
    */

    // ==== AB. special rules =====================================================================|
    /*
    for these rules to work:
    1. the selector for parent blocks need to be defined in "parentLevels".
    2. const enableLowlightHighlight needs to be set to 1 or css rules for lowlight1, lowlight2, etc need to be added to the page.

    special keywords:
    DELETE1: selected parent element is meant to be deleted.
    lowlight1: selected parent element should have strong lowlight.
    lowlight2: selected parent element should have weak lowlight.
    highlight1: selected parent element should have strong highlight.
    */
    if (0) {
        let customRules = [
            [/regex expressionA/i, "DELETE1"],
            [/regex expressionB/i, "lowlight1"],
            [/regex expressionC/i, "lowlight2"],
            [/regex expressionD/i, "highlight1"],
        ];
        replaceRules = replacesrules.concat(customRules);
    }

    // ==== AC. site selectors ====================================================================|
    
    // [ href regex, element regex , parent level]
    // "parent level" note: this count includes the element containing the text node itself.
    const parentLevels = [
        [/href-regex1/i, /identifying-class-or-id/i, 3],
        [/href-regex2/i, /identifying-class-or-id/i, 4],

        //[/\.com/i, //i,1],
    ];

    // ==== BA. script options ====================================================================|
    
   const enableLowlightHighlight = 1;

   const dynamicChecking = 1; // default 1; set to 1 to run the script automatically when new image elements are detected.
   const markCheckedElements = 1; // default 1; set to 0 if certain sites start appearing weirdly.
   // setting to 0 would make this run a few more times when dynamically checking.

   const logRuntimes = 1; // default 0; set to 1 to log function runtimes to the console.
   const fullDelete = 1; // default 1; text matching a "delete" rule has text completely replaced.

    // ==== CA. filter code =======================================================================|
    const domainName = window.location.hostname;
    const hrefString = window.location.href;

    let elementRegex, parentLevel;
    for (let index = 0; index < parentLevels.length; index++) {
        if (parentLevels[index][0].test(hrefString)) {
            elementRegex = parentLevels[index][1];
            parentLevel = parentLevels[index][2];
            break;
        }
    }
    if (elementRegex) {
        consolelog("## (FBT) CUSTOM FILTER | "+ elementRegex +" | "+ parentLevel +" ##", "SYS");
    }

    // resets lastIndex on tests with global modifiers.
    RegExp.prototype.regexTest = function(testString){
        //consolelog("## regexTest() ##", 1);
        if (this.test(testString)) {
            if (/.\/i?g/.test(this) && this.lastIndex) {//regex global modifier needs to be reset.
                //consolelog("## last index: "+ this.lastIndex +" ##", 1);
                this.lastIndex = 0;
            }
            return true;
        }
        return false;
    };

    // ==== replaceText() globals ====
    let titleChecked = 0; //if the page title was checked or not.
    let nodeCounter = 0; //counts text nodes.
    let blockCounter = 0; //count block nodes used in custom filters.

    NodeList.prototype.forEach = Array.prototype.forEach;
    // ==== CB. replaceText() =====================================================================|
    function replaceText() {

        if (logRuntimes) {
            var startTime = performance.now();
        }

        let numTerms = replaceRules.length;
        let ruleMatched = 0;
        let elementDeleted = 0;

        // ==== checks the title of the page ======================================================|
        let titleText = jQuery("title").text();
        if (titleText && !titleChecked) {
            for (let index = 0; index < numTerms; index++) {
                if (replaceRules[index][0].regexTest(titleText) && !/highlight1|lowlight2/.test(replaceRules[index][1])) {
                    consolelog("(title match): "+ titleText +" | "+ replaceRules[index][0], "TT-MA");
                    titleText = titleText.replace(replaceRules[index][0], replaceRules[index][1]);
                    jQuery("title").text(titleText);
                }
            }
            titleChecked = 1;
        }

        // ==== selects all text elements =========================================================|
        if(1){
            const excludedElements = /CODE|SCRIPT|STYLE/i;
            var textWalker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        if (node.nodeValue.trim() &&
                            !excludedElements.test(node.parentNode.nodeName) && // exclude scripts and style elements
                            !/fbt-chkd/.test(node.parentNode.classList)) { // exclude checked elements
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                },
                false
            );
        }
        let textNode = textWalker.nextNode();

        // ==== for each textNode =================================================================|
        while (textNode) {
            let currentText = textNode.nodeValue;
            let parentNode = textNode.parentNode;
            let filterParent = textNode.parentElement.parentElement.parentElement;
            // select parent element if defined.
            if (parentLevel && parentLevel != 3) {
                filterParent = selectParent(textNode, parentLevel);
            }

            // determines if site & parent matches custom filter rules.
            let customFilter = 0;
            if (
                elementRegex && filterParent &&
                ((filterParent.classList && elementRegex.test(filterParent.classList)) ||
                (filterParent.id && elementRegex.test(filterParent.id)))
                ) {
                customFilter = 1;
                
                if (filterParent.classList && !/FBT-block-/.test(filterParent.classList)) {
                    blockCounter++;
                    filterParent.classList.add("FBT-block-"+ blockCounter);
                }
            }

            // marks the element containing the text node.
            if (markCheckedElements && parentNode.nodeName != "DIV") {
                parentNode.classList.add("fbt-chkd");
            }

            let matchedDelete = 0;
            // for each rule...
            for (let index = 0; index < numTerms; index++) {
                if (replaceRules[index][0].regexTest(currentText.trim())) {
                    ruleMatched = 1;
                    consolelog(nodeCounter +" (match): "+ currentText +" | "+ replaceRules[index][0], "MA");

                    // ==== delete1 match =========================================================|
                    if (/DELETE1/.test(replaceRules[index][1])) {
                        if (!/DELETE1/.test(currentText)) {
                            consolelog(nodeCounter +" (FBT DEL): "+ currentText.trim() +" | "+ replaceRules[index][0], "DL-MA");
                        }
                        if (customFilter) { //delete parent element if site data is set.
                            filterParent.remove();
                            elementDeleted = 1;
                            break;
                        }
                        if (fullDelete) {
                            currentText = "## DLT1 ##"; // replaces the text completely.
                            break;
                        }else if (!matchedDelete){
                            currentText = "DLT1: " + currentText; // prepends DLT1.
                            matchedDelete = 1; //record a delete was matched.
                        }
                        
                    }

                    //acronym, css class
                    let filterStrings = ["","fbt-gen-replace"];
                    // ==== lowlight1 match =======================================================|
                    if (/lowlight1/.test(replaceRules[index][1])) {
                        filterStrings = ["LL1", "lowlight1"];
                    }else
                    // ==== lowlight2 match =======================================================|
                    if (/lowlight2/.test(replaceRules[index][1])) {
                        filterStrings = ["LL2", "lowlight2"];
                    }else
                    // ==== highlight1 match ======================================================|
                    if (/highlight1/.test(replaceRules[index][1])) {
                        filterStrings = ["HL1", "highlight1"];
                    }
                    if (filterStrings){
                        consolelog(nodeCounter +" ("+ filterStrings[0] +"): "+ currentText.trim() +" | "+ replaceRules[index][0], filterStrings[0]+"-MA");
                        if (customFilter) {
                            filterParent.classList.add(filterStrings[1]);
                        }
                    }

                    // ==== base case =============================================================|
                    if (!/highlight1|lowlight2/.test(replaceRules[index][1])) {
                        currentText = currentText.replace(replaceRules[index][0], replaceRules[index][1]);
                    }
                }
            } // end for (each rule)

            if (ruleMatched && !elementDeleted) {
                ruleMatched = 0;
                textNode.nodeValue = currentText;
                nodeCounter++;
                consolelog(nodeCounter +" (text): "+ currentText.trim(), "CH-TT");
            }
            textNode = textWalker.nextNode();
        } //end while (textNode)

        if (logRuntimes) {
            const endTime = performance.now();
            const runTime = ((endTime - startTime) / 1000).toFixed(2);
            if (runTime > 1) {
                consolelog('(FBT) finished after ' + runTime + ' seconds.', 1);
            }else {
                consolelog('(FBT) finished in less than 1 second.', 1);
            }
        }
    } //end function function replaceText()
    replaceText();

    // ==== CC. support functions =================================================================|
    function consolelog(text, messageType) {
        if (showLogMessages && enabledMessages.test(messageType)) {
            console.log(text);
        }
    }

    function selectParent(textNode, parentLevel) {
        if (textNode && parentLevel) {
            let filterParent = textNode.parentElement;
            while (parentLevel != 1 && filterParent.parentElement) {
                filterParent = filterParent.parentElement;
                parentLevel--;
            }
            return filterParent;
        }
        return 0;
    }

    if (dynamicChecking) {
        jQuery(document).ready(waitForKeyElements("img", replaceText));
    }

    // ==== DA. script button =====================================================================|
    if (jQuery("#ctb-buttons").length) {
        const wordReplaceCss =
`<style type="text/css">
    #FBT-reset {
        background: #03a9f4;
    }
</style>`;
        jQuery(document.body).append(wordReplaceCss); //bottom of the body
        jQuery("#ctb-buttons").prepend("<div id='FBT-reset'>FBT</div>"); //added to beginning
    }
    jQuery("#FBT-reset").click(replaceText);

    // ==== DB. lowlight/highlight css ============================================================|
    if (enableLowlightHighlight && elementRegex) {
        const highlightCss =
`<style type="text/css">
    .lowlight1 {
        opacity: .2;
    }
    .lowlight2 {
        opacity: .5;
    }
    .highlight1 {
        background: #67ff67; /*lime green*/
    }
</style>`;
        jQuery(document.body).append(highlightCss); //bottom of the body
    }

    // ==== script end ============================================================================|
    consolelog("#### (FBT) text replace script is active. ####");
})();

// ==UserScript==
// @name         Filter by Text
// @namespace    https://github.com/erickRecai
// @version      1.4.2
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
/* jshint esversion: 6 */

(function () {
    'use strict';

    if(0){/*
        last update: 3/1/2020

        == todo ==
        a. case: 2 text nodes have the same parent block.
        a. selector value names need to be have better names.
        b. site specific rule lists.
        c. update to enable multiple filter rules per site (multiple block selectors)

        == issues ==
        - certain text nodes aren't accessed with markCheckedElement enabled. (multiple text nodes)
        
        == how it works ==
        - calls replaceText() once for each major run.
        - visits each text node and checks them against each and every rule.
        - if the replacing text is special, more things are done to the text node.
        - the css for highlight and lowlight need to be set manually.
        - lowlight2 and highlight1 matches don't change text.
        
        == version history ==
        - 1.4.2: made custom filters more indepth, selecting by tag names enabled.
        - 1.4.1: cleaned for github, introduced custom filters.

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
    if(0){/*
        ## current message tags ##
        ## selects which messages are logged to console if enabled ##
        TT-MA // page title rule matches
        MA // any rule matches
        DL-MA|LL1-MA|LL2-MA|HL1-MA // specific rule matches
        CH-TT
        SYS // general system messages
        1 // high priority messages
    */}
    const enabledMessages = /TT-LG|DL|CA|LL|SYS|^1/;
    consolelog("#### (FBT) text replace script began. ####");
    const scriptTag = "FBTG";
    consolelog("#### ("+ scriptTag +") text replace script began. ####");

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
        //[//i, ""], // rule template

        // basic examples:
        //[/commit/i, "dog"],
        //[/branch/i, "turtle"],
        //[/file/i, "birdie"],
        //[/\w/g, "a"], //replaces all characters with "a".
        //[/(.|\W)+/i, "text"], //replaces all text instances with "text".
    ];

    /*
    could define rules in a seperate script for example:
    seperate script:
    unsafeWindow.externalRules = [["some text","some text"]];

    referencing those rules in this script:
    replaceRules = replaceRules.concat(unsafeWindow.externalRules);
    */

    // ==== AB. special rules =====================================================================|
    if(0){/*
        for these rules to work:
        1. the selector for parent blocks need to be defined in "parentLevels".
        2. const enableFilters needs to be set to 1.
        3. optional: css for lowlight1, lowlight2, highlight1
    
        special keywords:
        DELETE1: selected parent element is meant to be deleted.
        lowlight1: selected parent element should have strong lowlight.
        lowlight2: selected parent element should have weak lowlight.
        highlight1: selected parent element should have strong highlight.
    */}
    const enableFilters = 0; // default 0; set to 1 to enable highlighting, lowlighting, and parent deletion.
    if (enableFilters) {
        let customRules = [
            [/regex expressionA/i, "DELETE1"],
            [/regex expressionB/i, "lowlight1"],
            [/regex expressionC/i, "lowlight2"],
            [/regex expressionD/i, "highlight1"],

            [/filter-highlight/i,"DELETE1"],
            [/collapsable-toolbar/i,"lowlight1"],
            [/select-delete/i,"lowlight2"],
            [/filter-by-text/i,"highlight1"],
        ];
        replaceRules = replaceRules.concat(customRules);
    }

    // ==== AC. site selectors ====================================================================|
    // "parent level" note: this count includes the element containing the text node itself.
    //[href regexp, rule type, attribute name, attribute value, ancestor level]

    const parentLevels = [
        [/github\.com/i, "attribute", "class", /\bpublic\b/, 5],
        //[/\.com/i, //i,1],
    ];

    // ==== BA. script options ====================================================================|

   const dynamicChecking = 1; // default 1; set to 1 to run the script automatically when new image elements are detected.

   const markCheckedElements = 1; // default 1; set to 0 if certain sites start appearing weirdly.
   // setting to 0 would make this run a few more times when dynamically checking.
   const markBlockElements = 1; //default 1; set to 0 if certain sites lose functionality.
   // used to identify each parent block.  

   const logRuntimes = 1; // default 0; set to 1 to log function runtimes to the console.
   const fullDelete = 1; // default 1; text matching a "delete" rule has text completely replaced.
   const classPrefix = ""; // default ""; prefix of each class added by this script.

    // ==== CA. filter code =======================================================================|
    const domainName = window.location.hostname;
    const hrefString = window.location.href;

    let parentType, parentName, parentValue, parentLevel;
    for (let index = 0; index < parentLevels.length; index++) { //if href match, sets customer filters
        if (parentLevels[index][0].test(hrefString)) {
            parentType = parentLevels[index][1];
            parentName = parentLevels[index][2];
            parentValue = parentLevels[index][3];
            parentLevel = parentLevels[index][4];
            break;
        }
    }
    if (parentName) {
        consolelog("## ("+ scriptTag +") SITE FILTER | "+ parentName +" | "+ parentValue +" | "+ parentLevel +" ##", "SYS");
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
    let titleChecked = 0; // if the page title was checked or not.
    let nodeCounter = 0; // counts text nodes.
    let blockCounter = 0; // count block nodes used in custom filters.

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
            nodeCounter++;
            // marks the element containing the text node.
            if (markCheckedElements && parentNode.tagName != "DIV") {
                parentNode.classList.add(nodeCounter +"-fbt-chkd"); //prefix
            }

            let parentBlock = textNode.parentElement.parentElement.parentElement;
            // select parent element if defined.
            if (enableFilters && parentLevel && parentLevel != 3) {
                parentBlock = selectParent(textNode, parentLevel);
            }

            // 1.4.2
            // check parentblock with selectors to enable filters.
            let attributeValue = "";
            let parentBlockMatched = 0;
            if (enableFilters && parentType && /attribute/i.test(parentType) && parentName && parentBlock) {
                attributeValue = parentBlock.getAttribute(parentName);
                //console.log(attributeValue);
                if (attributeValue && parentValue.test(attributeValue)) {
                    parentBlockMatched = 1;
                    blockCounter++;
                    console.log(nodeCounter+"-"+ blockCounter +" pbl A value: "+ parentBlockMatched); //always 1;

                    //marks specific block elements
                    if (markBlockElements && parentBlock.classList && !/fbt-block-/.test(parentBlock.classList)) {
                        parentBlock.classList.add("fbt-block-"+ blockCounter); //prefix
                    }
                }
            }else if (enableFilters && parentType && /element/i.test(parentType) && parentValue.test(parentBlock.tagName)) {
                parentBlockMatched = 1;
                blockCounter++;
            }

            let matchedDelete = 0;
            // for each rule...
            for (let index = 0; index < numTerms; index++) {
                let currentRegex = replaceRules[index][0];
                let replaceValue = replaceRules[index][1];
                if (currentRegex.regexTest(currentText.trim())) {
                    ruleMatched = 1;
                    consolelog(nodeCounter +" (match): "+ currentText +" | "+ currentRegex, "MA");

                    // ==== delete1 match =========================================================|
                    if (/DELETE1/.test(replaceValue)) {
                        if (!/DELETE1/.test(currentText)) {
                            consolelog(nodeCounter +" ("+ scriptTag +" DL-MA): "+ currentText.trim() +" | "+ currentRegex, "DL-MA");
                        }
                        if (parentBlockMatched) { //delete parent element if site data is set.
                            parentBlock.remove();
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
                    let filterStrings = ["GEN","fbt-gen-replace"]; //prefix
                    // ==== lowlight1 match =======================================================|
                    if (/lowlight1|BLEH/.test(replaceValue)) {
                        filterStrings = ["LL1", classPrefix +"lowlight1"];
                    }else
                    // ==== lowlight2 match =======================================================|
                    if (/lowlight2/.test(replaceValue)) {
                        filterStrings = ["LL2", classPrefix +"lowlight2"];
                    }else
                    // ==== highlight1 match ======================================================|
                    if (/highlight1/.test(replaceValue)) {
                        filterStrings = ["HL1", classPrefix +"highlight1"];
                    }
                    if (enableFilters && parentBlockMatched){
                        consolelog(nodeCounter +"-"+ blockCounter +" ("+ scriptTag +" "+ filterStrings[0] +"-MA): "+ currentText.trim() +" | "+ currentRegex +" | "+ filterStrings[1], filterStrings[0]+"-MA");
                        parentBlock.classList.add(filterStrings[1]);
                    }
                    // ==== base case =============================================================|
                    if (!/highlight1|lowlight2/.test(replaceValue)) {
                        currentText = currentText.replace(currentRegex, replaceValue);
                    }
                }
            } // end for (each rule)

            if (ruleMatched && !elementDeleted) {
                ruleMatched = 0;
                textNode.nodeValue = currentText;
                consolelog(nodeCounter +" (text): "+ currentText.trim(), "CH-TT");
            }
            textNode = textWalker.nextNode();
        } //end while (textNode)

        if (logRuntimes) {
            const endTime = performance.now();
            const runTime = ((endTime - startTime) / 1000).toFixed(2);
            if (runTime > 1) {
                consolelog('('+ scriptTag +') finished after ' + runTime + ' seconds.', 1);
            }else {
                consolelog('('+ scriptTag +') finished in less than 1 second.', 1);
            }
        }
    } //end function function replaceText()

    replaceText();
    if (dynamicChecking) {
        jQuery(document).ready(waitForKeyElements("img", replaceText));
    }

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

    // ==== DA. script button =====================================================================|
    if (jQuery("#ctb-buttons").length) {
        const wordReplaceCss =
`<style type="text/css">
    #`+ scriptTag +`-reset {
        background: #03a9f4;
    }
</style>`;
        jQuery(document.body).append(wordReplaceCss); //bottom of the body
        jQuery("#ctb-buttons").prepend("<div id='"+ scriptTag +"-reset'>"+ scriptTag +"</div>"); //added to beginning
    }
    jQuery("#"+ scriptTag +"-reset").click(replaceText);

    // ==== DB. lowlight/highlight css ============================================================|
    if (enableFilters && parentValue) {
        const highlightCss =
`<style type="text/css">
    .lowlight1 {
        opacity: .2;
    }
    .lowlight2 {
        opacity: .5;
    }
    .highlight1 {
        background: #94ff94; /*lime green*/
    }
</style>`;
        jQuery(document.body).append(highlightCss); //bottom of the body
    }

    // ==== script end ============================================================================|
    consolelog("#### ("+ scriptTag +") text replace script is active. ####");
})();
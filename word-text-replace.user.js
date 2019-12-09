// ==UserScript==
// @name         Word & Text Replace
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  replaces text with other text.
// @author       listfilterErick
// @grant        none

// @match        *://*/*

// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @require      https://greasyfork.org/scripts/5392-waitforkeyelements/code/WaitForKeyElements.js?version=115012

// @licence      CC-BY-NC-SA-4.0; https://creativecommons.org/licenses/by-nc-sa/4.0/
// @licence      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==
/*jshint esversion: 6*/

/*
    Update Log 1.3.1
    - new options: 
    -- logMatches, logChangedText
    -- dontMarkDivs, checkHyperlinkElements
    - cleanup: changed variable names, cleaned up function code.

    * Text nodes are trimmed before checking but changed text is not trimmed unless specified in the regex.
*/

(function () {

    let replaceRules = [];
    
    /*
        regex reference
        \b: word boundry
        \W: any non-alpha character
    */
    if (1) {
        replaceRules.push(
            // basic examples:
            //[/(.\W?)*/i, 'words'], //replace all text instances with "words".
            //[/\w/gi, 'a'], //replace all characters with an "a" character.
            //[/match/gi, 'a'], //matches "match" in "ABmarchCD" and "red match".
            //[/\bmatch\b/gi, 'a'], //does not match "ABmatchesCD" but does match "this match is red".
            //[/scripts/gi, 'dictionaries'],
            //[/script/gi, 'dictionary'],
            //[/(web)?site/gi, 'webzone'],
        );
        // separated just for an example of an option of grouping/sorting.
        replaceRules.push(
            //[/user/gi, 'individual'],
            //[/\buse\b/gi, 'utilize'],
        );
    }
    /*
        #### note on moving rules to a seperate userscript ####
        https://wiki.greasespot.net/UnsafeWindow
        unsafeWindow.replaceRules = replaceRules; //set rules(page scope) to rules(script scope)
        replaceRules = unsafeWindow.replaceRules; //set rules(script scope) to rules(page scope)
    */

    const showReplaceButton = 0; // set to 1 to show a button to manually run this script.
    const buttonTransparency = .2; // set to a value between 0 and 1, 1 is no transparency, .5 is 50% transparency.
    const dynamicChecking = 1; // set to 1 to run the script automatically when new image elements are detected.

    const showLogMessages = 0; // set to 1 to log script messages, overrides the following log options.
    const logMatches = 1; // set to 1 to log matches to the console.
    const logChangedText = 0; // set to 1 to log changed text to the console.
    const logRuntimes = 1; // set to 1 to log function runtimes to the console.

    const dontMarkDivs = 1; // set to 1 to not mark divs as checked, solves some site issues.
    // setting to 1 would make dynamic checks recheck checked divs.

    function consolelog(text, showOption) {
        if (showLogMessages && showOption) {
            console.log(text);
        }
    }

    let titleChecked = 0;
    let nodeCounter = 1;
    let aCounter = 1;

    // ==== replaceText() =========================================================================|
    function replaceText() {

        if (logRuntimes) {
            var startTime = performance.now();
        }

        let numTerms = replaceRules.length;
        let ruleMatched = 0;

        // ==== title element =====================================================================|
        let titleText = jQuery("title").text();
        if (titleText && !titleChecked) {
            for (let index = 0; index < numTerms; index++) {
                if (replaceRules[index][0].test(titleText)) {
                    consolelog("(title match): "+ titleText +" | "+ replaceRules[index][0], logMatches);
                    titleText = titleText.replace(replaceRules[index][0], replaceRules[index][1]);
                    jQuery("title").text(titleText);
                }
            }
            titleChecked = 1;
        }

        // ==== text elements =====================================================================|
        let textWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (node.nodeValue.trim() &&
                        !/code|script|style|textarea/i.test(node.parentNode.nodeName) && // exclude scripts and style elements
                        !/wr-checked/.test(node.parentNode.classList)) { // exclude checked elements
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );
        let textNode = textWalker.nextNode();
        while (textNode) {
            let currentText = textNode.nodeValue;
            let parentNode = textNode.parentNode;
            if (!dontMarkDivs || parentNode.nodeName != "DIV") { //supposedly adding a class to a div broke a site somehow.
                parentNode.classList.add("wr-checked");
            }
            for (let index = 0; index < numTerms; index++) {
                if (replaceRules[index][0].test(currentText.trim())) {// ## checks the trimmed text.
                    ruleMatched = 1;
                    consolelog(nodeCounter +" (text match): "+ currentText +" | "+ replaceRules[index][0], logMatches);
                    currentText = currentText.replace(replaceRules[index][0], replaceRules[index][1]);
                }
            }
            if (ruleMatched) {
                ruleMatched = 0;
                textNode.nodeValue = currentText;
                consolelog(nodeCounter +" (text): "+ currentText.trim(), logChangedText);
                nodeCounter++;
            }
            textNode = textWalker.nextNode();
        }

        if (logRuntimes) {
            const endTime = performance.now();
            const runTime = ((endTime - startTime) / 1000).toFixed(2);
            if (runTime > 1) {
                consolelog('(WR) finished after ' + runTime + ' seconds.', 1);
            }else {
                consolelog('(WR) finished in less than 1 second.', 1);
            }
        }

    } //end function replaceText()

    replaceText();
    if (dynamicChecking) {
        jQuery(document).ready(waitForKeyElements("img", replaceText));
        //jQuery(window).on("load", function() { //after all initial images are loaded.
            //waitForKeyElements("img", replaceText);
        //});
    }

    if (showReplaceButton) {
        if (!jQuery("#wt-buttons").length) {
            consolelog("(WR) created #wt-buttons.");
            jQuery("body").prepend("<div id='wt-buttons'><div id='wr-reset'>WR</div><div id='wt-close'>&times;</div></div>");
            jQuery("#wt-close").click(function () { jQuery("#wt-buttons").remove(); });

            const webToolsCss =
                `<style type="text/css">
    #wt-buttons {
        width: 50px;
        display: block;
        opacity: `+ buttonTransparency + `;
        position: fixed;
        top: 0px;
        right: 0px;
        z-index: 999;
    }
    #wt-buttons:hover {
        opacity: 1;
    }
    #wt-buttons div {
        display: block !important;
        padding: 5px;
        border-radius: 5px;
        margin-top: 2px;
        font-size: initial !important;
        font-weight: bold;
        color: white;
        cursor: pointer;
    }
    #wt-close {
        background: #777777;
        text-align: center;
    }
</style>`;

            jQuery(document.body).append(webToolsCss);
        } else {
            jQuery("#wt-buttons").prepend("<div id='wr-reset'>WR</div>");
        }
        jQuery("#wr-reset").click(replaceText);

        const wordReplaceCss =
            `<style type="text/css">
    #wr-reset {
        background: #ffb51b;
    }
</style>`;

        jQuery(document.body).append(wordReplaceCss);
    } // end if (showReplaceButton)
})();

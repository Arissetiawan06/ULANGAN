/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global _ */

(function () {
    "use strict";

    var fs     = require("fs"),
        mdjson = require("metadata-json");

    /**
     * Validate
     * @param {string} fullPath Model file (.mdj) to be validate
     */
    function validate(fullPath) {
        mdjson.Repository.clear();
        var project = mdjson.loadFromFile(fullPath);
        return mdjson.Validator.validate();
    }

    /**
     * Export to PDF
     * @param {string} fullPath Model file (.mdj) to be exported
     * @param {Array.<string>} diagrams Array of diagram's id to be exported
     * @param {string} filename Filename for an exported PDF
     * @param {Object} options Options for exporting PDF
     */
    function exportToPDF(fullPath, diagramIds, filename, options) {
        var project = mdjson.loadFromFile(fullPath);
        var diagrams = _.map(diagramIds, function (id) { return mdjson.Repository.get(id); });
        return mdjson.exportToPDF(diagrams, filename, options);
    }

    /**
     * Export to HTML
     * @param {string} fullPath Model file (.mdj) to be exported
     * @param {string} targetDir Path for an exported HTML files
     */
    function exportToHTML(fullPath, targetDir) {
        mdjson.loadFromFile(fullPath);
        return mdjson.exportToHTML(targetDir);
    }

    /**
     * Register font
     * @param {strong} path Path name containing .ttf font files and font.json
     */
    function registerFont(path) {
        mdjson.registerFont(path);
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("MetadataJson")) {
            domainManager.registerDomain("MetadataJson", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "MetadataJson", // domain name
            "validate",     // command name
            validate,       // command handler function
            false,          // this command is synchronous in Node ("false" means synchronous")
            "Returns the validation results",
            [
                {
                    name: "fullPath",
                    type: "string",
                    description: "full path name for a file to be validated"
                }
            ],
            [
                {
                    name: "result", // return values
                    type: "string",
                    description: "result"
                }
            ]
        );
        domainManager.registerCommand(
            "MetadataJson", // domain name
            "exportToPDF",  // command name
            exportToPDF,    // command handler function
            false,          // this command is synchronous in Node ("false" means synchronous")
            "Export diagram(s) to a PDF file",
            [
                {
                    name: "fullPath",
                    type: "string",
                    description: "full path name for a .mdj file to be exported to a PDF file"
                },
                {
                    name: "diagramIds",
                    type: "Array.<string>",
                    description: "Array of diagram's id to be exported"
                },
                {
                    name: "filename",
                    type: "string",
                    description: "filename for an exported PDF"
                },
                {
                    name: "options",
                    type: "object",
                    description: "options for exporting a PDF file"
                }
            ],
            [
                {
                    name: "result", // return values
                    type: "string",
                    description: "result"
                }
            ]
        );
        domainManager.registerCommand(
            "MetadataJson", // domain name
            "exportToHTML", // command name
            exportToHTML,   // command handler function
            false,          // this command is synchronous in Node ("false" means synchronous")
            "Export project to HTML docs",
            [
                {
                    name: "fullPath",
                    type: "string",
                    description: "full path name for a .mdj file to be exported to a PDF file"
                },
                {
                    name: "targetDir",
                    type: "string",
                    description: "path for exported HTML docs"
                }
            ],
            [
                {
                    name: "result", // return values
                    type: "string",
                    description: "result"
                }
            ]
        );
        domainManager.registerCommand(
            "MetadataJson", // domain name
            "registerFont", // command name
            registerFont,   // command handler function
            false,          // this command is synchronous in Node ("false" means synchronous")
            "Register font",
            [
                {
                    name: "path",
                    type: "string",
                    description: "Path name containing .ttf font files and font.json"
                }
            ]
        );
    }

    exports.init = init;

}());

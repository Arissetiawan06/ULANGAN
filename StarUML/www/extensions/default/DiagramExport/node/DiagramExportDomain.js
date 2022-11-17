/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";

    var fs = require("fs");

    /**
     * @private
     * Handler function for the DiagramExport.writeFile command.
     * @param {string} filename
     * @param {string} base64 encoded binary data
     * @return {string}
     */
    function writeFile(filename, base64Buffer) {
        var buffer = new Buffer(base64Buffer, 'base64');
        var result = null;
        result = fs.writeFileSync(filename, buffer);
        return result;
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("DiagramExport")) {
            domainManager.registerDomain("DiagramExport", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "DiagramExport", // domain name
            "writeFile",     // command name
            writeFile,       // command handler function
            false,           // this command is synchronous in Node
            "Returns the total or free memory on the user's system in bytes",
            [
                {
                    name: "filename", // parameters
                    type: "string",
                    description: "file name"
                },
                {
                    name: "base64Buffer", // parameters
                    type: "string",
                    description: "base64-encoded data"
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
    }

    exports.init = init;

}());

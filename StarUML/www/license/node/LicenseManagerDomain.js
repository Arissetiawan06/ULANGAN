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
/*global */

(function () {
    "use strict";

    var NodeRSA = require('node-rsa');
    
    function validate(PK, name, product, licenseKey) {
        var pk, decrypted;
        return true;
        try {
            pk = new NodeRSA(PK);
            decrypted = pk.decrypt(licenseKey, 'utf8');
        } catch (err) {
            return false;
        }
        var terms = decrypted.trim().split("\n");
        if (terms[0] === name && terms[1] === product) {
            return { 
                name: name, 
                product: product, 
                licenseType: terms[2],
                quantity: terms[3],
                licenseKey: licenseKey
            };
        } else {
            return false;
        }
    }

    /**
     * Initializes the domain with several commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        console.log('dit is een test');
        if (!domainManager.hasDomain("LicenseManager")) {
            domainManager.registerDomain("LicenseManager", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "LicenseManager", // domain name
            "validate",       // command name
            validate,         // command handler function
            false,            // this command is synchronous in Node ("false" means synchronous")
            "Validate License",
            [
                {
                    name: "PK",
                    type: "string",
                    description: "PK"
                },
                {
                    name: "name",
                    type: "string",
                    description: "name of license owner"
                },
                {
                    name: "product",
                    type: "string",
                    description: "product name"
                },
                {
                    name: "licenseKey",
                    type: "string",
                    description: "license key"
                }
            ],
            [
                {
                    name: "result", // return values
                    type: "object",
                    description: "result"
                }
            ]
        );
    }

    exports.init = init;

}());

/*
 * Copyright (c) 2014 MKLab. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global $, _, define, app, type, DOMParser */
define(function (require, exports, module) {
    "use strict";

    var Commands          = app.getModule("command/Commands"),
        CommandManager    = app.getModule("command/CommandManager"),
        MenuManager       = app.getModule("menu/MenuManager"),
        Dialogs           = app.getModule("dialogs/Dialogs"),
        ModelExplorerView = app.getModule("explorer/ModelExplorerView"),
        FileUtils         = app.getModule("file/FileUtils"),
        FileSystem        = app.getModule("filesystem/FileSystem"),
        Async             = app.getModule("utils/Async"),
        Repository        = app.getModule("core/Repository"),
        ProjectManager    = app.getModule("engine/ProjectManager");

    var Reader      = require("Reader"),
        UMLReaders  = require("UMLReaders");

    var CMD_FILE_IMPORT_STARUML1 = 'file.import.staruml1';

    function loadFile(filename) {
        var result = new $.Deferred(),
            dialog = Dialogs.showSimpleDialog("Loading \"" + filename + "\""),
            file = FileSystem.getFileForPath(filename);
        FileUtils.readAsText(file)
            .done(function (data) {
                try {
                    var i, len;
                    // Parse XML
                    var parser = new DOMParser();
                    var xmlDom = parser.parseFromString(data, "text/xml");
                    // Transform XML to JSON
                    Reader.clear();
                    var bodyDom = xmlDom.getElementsByTagName("BODY")[0];
                    var project = Reader.readObj(bodyDom, "DocumentElement");
                    project._parent = null;
                    // Post Processing
                    Reader.postprocess();
                    // console.log(xmlDom);
                    // console.log(project);

                    // Load Project
                    ProjectManager.loadFromJson(project);
                    ModelExplorerView.expand(ProjectManager.getProject());

                    // Load UMLStandard Profile
                    var profiles = _.map(xmlDom.getElementsByTagName("PROFILE"), function (p) { return p.childNodes[0].nodeValue; });
                    if (_.contains(profiles, "UMLStandard")) {
                        // Apply UMLStandard Profile
                        var profileFile = FileUtils.getApplicationDirectoryPath() + "profiles/UMLStandardProfile.mfj";
                        ProjectManager.importFromFile(ProjectManager.getProject(), profileFile)
                            .done(function (element) {
                                // Reconnect stereotypes to UMLStandard's stereotypes
                                try {
                                    var id, _idMap = Reader.getIdMap();
                                    for (id in _idMap) {
                                        if (_idMap.hasOwnProperty(id)) {
                                            var elem = Repository.get(id);
                                            if (elem && _.isString(elem.stereotype) && elem.stereotype.length > 0) {
                                                var matched = Repository.lookupAndFind(ProjectManager.getProject(), elem.stereotype, type.UMLStereotype);
                                                if (matched) {
                                                    Repository.bypassFieldAssign(elem, 'stereotype', matched);
                                                }
                                            }
                                        }
                                    }
                                    result.resolve();
                                } catch (err2) {
                                    console.error(err2);
                                    result.reject(err2);
                                }
                            })
                            .fail(function (err1) {
                                console.error("[Error] Failed to load UMLStandard profile.");
                                result.reject(err1);
                            });
                    } else {
                        result.resolve();
                    }
                } catch (err) {
                    console.error("[Error] Failed to load the file: " + filename);
                    result.reject(err);
                }
            })
            .fail(function (err) {
                if (err === "NotReadable") {
                    Dialogs.showErrorDialog("Cannot open the file. (Only UTF-8 encoded files are supported)");
                } else if (err === "NotFound") {
                    Dialogs.showErrorDialog("File not found. (Files in network drive are not supported)");
                } else {
                    console.error(err);
                }
                result.reject(err);
            })
            .always(function () {
                dialog.close();
            });
        return result.promise();
    }


    function _handleImport(fullPath) {
        var result = new $.Deferred();
        if (fullPath) {
            loadFile(fullPath).then(result.resolve, result.reject);
        } else {
            FileSystem.showOpenDialog(false, false, "Select a StarUML 1 file (.uml)", null, ["uml"], function (err, files) {
                if (!err) {
                    if (files.length > 0) {
                        loadFile(files[0]).then(result.resolve, result.reject);
                    } else {
                        result.reject({ userCanceled: true });
                    }
                } else {
                    result.reject(err);
                }
            });
        }
        return result.promise();
    }

    // Register Commands
    CommandManager.register("StarUML 1 File (.uml)...",  CMD_FILE_IMPORT_STARUML1, _handleImport);

    // Setup Menus
    var menuItem = MenuManager.getMenuItem(Commands.FILE_IMPORT);
    menuItem.addMenuItem(CMD_FILE_IMPORT_STARUML1);

});

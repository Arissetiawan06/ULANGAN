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
/*global $, define, app, C2S, md5 */
define(function (require, exports, module) {
    "use strict";

    var FileUtils      = app.getModule("file/FileUtils"),
        FileSystem     = app.getModule("filesystem/FileSystem"),
        Async          = app.getModule("utils/Async"),
        Repository     = app.getModule("core/Repository"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        Commands       = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        MenuManager    = app.getModule("menu/MenuManager"),
        DiagramManager = app.getModule("diagrams/DiagramManager"),
        Dialogs        = app.getModule("dialogs/Dialogs"),
        MetadataJson   = app.getModule("metadata-json/MetadataJson");

    var CMD_FILE_EXPORT_HTML_DOCS   = 'file.export.htmlDocs';

    var USER_CANCELED = { userCanceled: true };

    var DOC_FOLDER = "/html-docs";

    function toFilename(elem) {
        var fn = md5(elem._id);
        return fn;
    }

    function exportToHTML(path) {
        var result = new $.Deferred();
        // Export diagram images
        var diagrams = Repository.getInstancesOf("Diagram");
        MetadataJson.exportToHTML(ProjectManager.getFilename(), path)
            .done(function () {
                Async.doInParallel(
                    diagrams,
                    function (diagram) {
                        var fn = path + "/diagrams/" + toFilename(diagram) + ".svg";
                        return CommandManager.execute("file.exportDiagramAs.svg", diagram, fn);
                    },
                    false
                ).then(result.resolve, result.reject);
            })
            .fail(function (err) {
                Dialogs.showErrorDialog("Failed to export HTML docs. (Error=" + err + ")");
                console.error(err);
                result.reject(err);
            });
        return result.promise();
    }

    function _handleExportHTML(path) {
        var result = new $.Deferred();
        if (Repository.isModified() || !ProjectManager.getFilename()) {
            Dialogs.showInfoDialog("Save changes before export HTML docs").done(function () {
                result.reject(USER_CANCELED);
            });
        } else {
            // If path is not assigned, popup Open Dialog to select a folder
            if (!path) {
                FileSystem.showOpenDialog(false, true, "Select a folder where HTML docs to be exported", null, null, function (err, files) {
                    if (!err) {
                        if (files.length > 0) {
                            path = files[0];
                            exportToHTML(path + DOC_FOLDER).then(result.resolve, result.reject);
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            } else {
                exportToHTML(path + DOC_FOLDER).then(result.resolve, result.reject);
            }
        }
        return result.promise();
    }

    // Register Commands
    CommandManager.register("HTML Docs...", CMD_FILE_EXPORT_HTML_DOCS,   _handleExportHTML);

    // Setup Menus
    var menuItem = MenuManager.getMenuItem(Commands.FILE_EXPORT);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FILE_EXPORT_HTML_DOCS);

});

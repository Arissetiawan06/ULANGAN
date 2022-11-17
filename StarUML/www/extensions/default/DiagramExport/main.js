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
/*global $, define, app, _, C2S */
define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils  = app.getModule("utils/ExtensionUtils"),
        NodeDomain      = app.getModule("utils/NodeDomain"),
        Async           = app.getModule("utils/Async"),
        FileUtils       = app.getModule("file/FileUtils"),
        FileSystem      = app.getModule("filesystem/FileSystem"),
        FileSystemError = app.getModule("filesystem/FileSystemError"),
        Graphics        = app.getModule("core/Graphics"),
        Repository      = app.getModule("core/Repository"),
        Commands        = app.getModule("command/Commands"),
        CommandManager  = app.getModule("command/CommandManager"),
        MenuManager     = app.getModule("menu/MenuManager"),
        DiagramManager  = app.getModule("diagrams/DiagramManager"),
        Dialogs         = app.getModule("dialogs/Dialogs");

    // load canvas2svg.js
    require("./canvas2svg");

    var CMD_FILE_EXPORT_DIAGRAM_AS              = 'file.exportDiagramAs',
        CMD_FILE_EXPORT_DIAGRAM_AS_PNG          = 'file.exportDiagramAs.png',
        CMD_FILE_EXPORT_DIAGRAM_AS_JPEG         = 'file.exportDiagramAs.jpeg',
        CMD_FILE_EXPORT_DIAGRAM_AS_SVG          = 'file.exportDiagramAs.svg',
        CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_PNGS  = 'file.exportDiagramAs.allTo.pngs',
        CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_JPEGS = 'file.exportDiagramAs.allTo.jpegs',
        CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_SVGS  = 'file.exportDiagramAs.allTo.svgs';

    // Diagram Export Domaon
    var DiagramExportDomain = new NodeDomain("DiagramExport", ExtensionUtils.getModulePath(module, "node/DiagramExportDomain"));

    function _showError(err) {
        Dialogs.showErrorDialog("Failed to export diagram (Error=" + err + ")");
    }
        
    /**
     * Get Base64-encoded image data of editor.diagram
     * @param {Editor} editor
     * @param {string} type (e.g. "image/png")
     * @return {string}
     */
    function getImageData(diagram, type) {
        // Make a new canvas element for making image data
        var canvasElement = document.createElement("canvas"),
            canvas        = new Graphics.Canvas(canvasElement.getContext("2d")),
            boundingBox   = diagram.getBoundingBox(canvas),
            rectExpand    = 10;

        // Initialize new canvas
        boundingBox.expand(rectExpand);
        canvas.origin = new Graphics.Point(-boundingBox.x1, -boundingBox.y1);
        canvas.zoomFactor = new Graphics.ZoomFactor(1, 1);
        canvasElement.width = boundingBox.getWidth() + 30;
        canvasElement.height = boundingBox.getHeight()+ 30;

        // Setup for High-DPI (Retina) Display
        if (window.devicePixelRatio) {
            var w = canvasElement.width,
                h = canvasElement.height;
            canvas.ratio = window.devicePixelRatio;
            canvasElement.width = w * canvas.ratio;
            canvasElement.height = h * canvas.ratio;
            canvasElement.style.width = w + "px";
            canvasElement.style.height = h + "px";
        }

        // Draw diagram to the new canvas
        if (type === "image/jpeg") {
            canvas.context.fillStyle = "#ffffff";
            canvas.context.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        diagram.drawDiagram(canvas);

        // Return the new canvas to base64-encoded data
        var data = canvasElement.toDataURL(type).replace(/^data:image\/(png|jpeg);base64,/, "");
        return data;
    }

    /**
     * Get SVG image data of editor.diagram
     * @param {Diagram} diagram
     * @return {string}
     */
    function getSVGImageData(diagram) {
        // Make a new SVG canvas for making SVG image data
        var c2s         = new C2S(),
            canvas      = new Graphics.Canvas(c2s),
            boundingBox,
            rectExpand  = 10;

        // Initialize new SVG Canvas
        boundingBox = diagram.getBoundingBox(canvas);
        boundingBox.expand(rectExpand);
        canvas.origin = new Graphics.Point(-boundingBox.x1, -boundingBox.y1);
        canvas.zoomFactor = new Graphics.ZoomFactor(1, 1);
        c2s.setWidth(boundingBox.getWidth());
        c2s.setHeight(boundingBox.getHeight());

        // Draw diagram to the new SVG Canvas
        _.each(diagram.ownedViews, function (v) {
            v.size(canvas);
            v.arrange(canvas);
        });
        diagram.drawDiagram(canvas);

        // Return the SVG data
        var data = c2s.getSerializedSvg(true);
        return data;
    }


    /**
     * Write base64 data As Binary File
     *
     * @param {string} filename
     * @param {string} base64Buffer
     * @return {$.Promise}
     */
    function _writeBinaryFile(filename, base64Buffer) {
        return DiagramExportDomain.exec("writeFile", filename, base64Buffer);
    }

    /**
     * Export Diagram as PNG
     *
     * @param {Diagram} diagram
     * @param {string} filePath
     * @return {$.Promise}
     */
    function _handleExportPNG(diagram, filePath) {
        var result = new $.Deferred();

        // If diagram is not provided, use active diagram
        if (!diagram) {
            var editor = DiagramManager.getEditor();
            if (editor) {
                DiagramManager.deselectAll();
                diagram = editor.diagram;
            }
        }

        if (diagram) {
            // Make image data
            var data;
            try {
                diagram.deselectAll();
                data = getImageData(diagram, "image/png");
            } catch (e) {
                result.reject(e);
            }

            // Save to file
            if (filePath) {
                _writeBinaryFile(filePath, data).then(result.resolve, result.reject);
            } else {
                var initialFilePath = FileUtils.convertToWindowsFilename(diagram.name.length > 0 ? diagram.name : "diagram");
                FileSystem.showSaveDialog("Export Diagram as PNG", null, initialFilePath + ".png", function (err, filename) {
                    if (!err) {
                        if (filename) {
                            if (!FileUtils.getFileExtension(filename)) {
                                filename = filename + ".png";
                            }
                            _writeBinaryFile(filename, data)
                                .done(function () {
                                    result.resolve();
                                })
                                .fail(function (err) {
                                    _showError(err);
                                    console.error(err);
                                    result.reject(err);
                                });
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
        return result.promise();
    }


    /**
     * Export Diagram as JPEG
     * @param {Diagram} diagram
     * @param {string} filePath
     */
    function _handleExportJPEG(diagram, filePath) {
        var result = new $.Deferred();

        // If diagram is not provided, use active diagram
        if (!diagram) {
            var editor = DiagramManager.getEditor();
            if (editor) {
                DiagramManager.deselectAll();
                diagram = editor.diagram;
            }
        }

        if (diagram) {
            // Make image data
            var data;
            try {
                diagram.deselectAll();
                data = getImageData(diagram, "image/jpeg");
            } catch (e) {
                result.reject(e);
            }

            // Save to file
            if (filePath) {
                _writeBinaryFile(filePath, data).then(result.resolve, result.reject);
            } else {
                var initialFilePath = FileUtils.convertToWindowsFilename(diagram.name.length > 0 ? diagram.name : "diagram");
                FileSystem.showSaveDialog("Export Diagram as JPEG", null, initialFilePath + ".jpg", function (err, filename) {
                    if (!err) {
                        if (filename) {
                            if (!FileUtils.getFileExtension(filename)) {
                                filename = filename + ".jpg";
                            }
                            _writeBinaryFile(filename, data)
                                .done(function () {
                                    result.resolve();
                                })
                                .fail(function (err) {
                                    _showError(err);
                                    console.error(err);
                                    result.reject(err);
                                });                            
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
        return result.promise();
    }


    /**
     * Export Diagram as SVG
     * @param {Diagram} diagram
     * @param {string} filePath
     */
    function _handleExportSVG(diagram, filePath) {
        var result = new $.Deferred();

        // If diagram is not provided, use active diagram
        if (!diagram) {
            var editor = DiagramManager.getEditor();
            if (editor) {
                DiagramManager.deselectAll();
                diagram = editor.diagram;
            }
        }

        if (diagram) {
            // Make image data
            var data;
            try {
                diagram.deselectAll();
                data = getSVGImageData(diagram);
            } catch (e) {
                result.reject(e);
            }

            // Save to file
            if (filePath) {
                var file = FileSystem.getFileForPath(filePath);
                FileUtils.writeText(file, data, true).then(result.resolve, result.reject);
            } else {
                var initialFilePath = FileUtils.convertToWindowsFilename(diagram.name.length > 0 ? diagram.name : "diagram");
                FileSystem.showSaveDialog("Export Diagram as SVG", null, initialFilePath + ".svg", function (err, filename) {
                    if (!err) {
                        if (filename) {
                            if (!FileUtils.getFileExtension(filename)) {
                                filename = filename + ".svg";
                            }
                            var file = FileSystem.getFileForPath(filename);
                            FileUtils.writeText(file, data, true)
                                .done(function () {
                                    result.resolve();
                                })
                                .fail(function (err) {
                                    _showError(err);
                                    console.error(err);
                                    result.reject(err);
                                });                            
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
        return result.promise();
    }

    /**
     * Export a list of diagrams
     *
     * @param {string} format One of `png`, `jpg`, `svg`.
     * @param {Array.<Diagram>} diagrams
     * @param {string} basePath
     */
    function exportAll(format, diagrams, basePath) {
        var result = new $.Deferred();
        var path = basePath + "/" + format,
            directory = FileSystem.getDirectoryForPath(path);
        directory.create(function (err, stat) {
            if (!err || err === "AlreadyExists") {
                Async.doSequentially(
                    diagrams,
                    function (diagram, idx) {
                        var fn = path + "/" + FileUtils.convertToWindowsFilename(diagram.getPathname()) + "_" + idx + "." + format;
                        switch (format) {
                        case 'png':
                            return _handleExportPNG(diagram, fn);
                        case 'jpg':
                            return _handleExportJPEG(diagram, fn);
                        case 'svg':
                            return _handleExportSVG(diagram, fn);
                        }
                    },
                    false
                ).then(result.resolve, result.reject);
            } else {
                result.reject(err);
            }
        });
        return result.promise();
    }

    /**
     * Export all diagram to PNGs. Create a folder on base folder and
     * all diagrams are exported as PNG file on the created folder.
     *
     * @param {string} basePath
     * @return {$.Promise}
     */
    function _handleExportAllToPNGs(basePath) {
        var result = new $.Deferred();
        var diagrams = Repository.getInstancesOf("Diagram");
        if (diagrams && diagrams.length > 0) {
            if (basePath) {
                exportAll('png', diagrams, basePath).then(result.resolve, result.reject);
            } else {
                FileSystem.showOpenDialog(false, true, "Select a folder where all diagrams to be exported as PNGs", null, null, function (err, files) {
                    if (!err) {
                        if (files.length > 0) {
                            exportAll('png', diagrams, files[0]).then(result.resolve, result.reject);
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
    }

    /**
     * Export all diagram to JPEGs. Create a folder on base folder and
     * all diagrams are exported as JPEG file on the created folder.
     *
     * @param {string} basePath
     * @return {$.Promise}
     */
    function _handleExportAllToJPEGs(basePath) {
        var result = new $.Deferred();
        var diagrams = Repository.getInstancesOf("Diagram");
        if (diagrams && diagrams.length > 0) {
            if (basePath) {
                exportAll('jpg', diagrams, basePath).then(result.resolve, result.reject);
            } else {
                FileSystem.showOpenDialog(false, true, "Select a folder where all diagrams to be exported as JPEGs", null, null, function (err, files) {
                    if (!err) {
                        if (files.length > 0) {
                            exportAll('jpg', diagrams, files[0]).then(result.resolve, result.reject);
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
    }


    /**
     * Export all diagram to SVGs. Create a folder on base folder and
     * all diagrams are exported as SVG file on the created folder.
     *
     * @param {string} basePath
     * @return {$.Promise}
     */
    function _handleExportAllToSVGs(basePath) {
        var result = new $.Deferred();
        var diagrams = Repository.getInstancesOf("Diagram");
        if (diagrams && diagrams.length > 0) {
            if (basePath) {
                exportAll('svg', diagrams, basePath).then(result.resolve, result.reject);
            } else {
                FileSystem.showOpenDialog(false, true, "Select a folder where all diagrams to be exported as SVGs", null, null, function (err, files) {
                    if (!err) {
                        if (files.length > 0) {
                            exportAll('svg', diagrams, files[0]).then(result.resolve, result.reject);
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            result.reject("No diagram to export.");
        }
    }

    // Register Commands
    CommandManager.register("Export Diagram As", CMD_FILE_EXPORT_DIAGRAM_AS,              CommandManager.doNothing);
    CommandManager.register("PNG...",            CMD_FILE_EXPORT_DIAGRAM_AS_PNG,          _handleExportPNG);
    CommandManager.register("JPEG...",           CMD_FILE_EXPORT_DIAGRAM_AS_JPEG,         _handleExportJPEG);
    CommandManager.register("SVG...",            CMD_FILE_EXPORT_DIAGRAM_AS_SVG,          _handleExportSVG);
    CommandManager.register("All to PNGs...",    CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_PNGS,  _handleExportAllToPNGs);
    CommandManager.register("All to JPEGs...",   CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_JPEGS, _handleExportAllToJPEGs);
    CommandManager.register("All to SVGs...",    CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_SVGS,  _handleExportAllToSVGs);

    // Setup Menus
    var menu = MenuManager.getMenu(Commands.FILE);
    var menuItem = menu.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS, "", MenuManager.AFTER, Commands.FILE_EXPORT);
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_PNG);
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_JPEG);
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_SVG);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_PNGS);
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_JPEGS);
    menuItem.addMenuItem(CMD_FILE_EXPORT_DIAGRAM_AS_ALL_TO_SVGS);

});

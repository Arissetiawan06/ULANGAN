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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, app, type, appshell, document, kendo */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils     = app.getModule("utils/ExtensionUtils"),
        PanelManager       = app.getModule("utils/PanelManager"),
        Graphics           = app.getModule("core/Graphics"),
        Repository         = app.getModule("core/Repository"),
        SelectionManager   = app.getModule("engine/SelectionManager"),
        ProjectManager     = app.getModule("engine/ProjectManager"),
        CommandManager     = app.getModule("command/CommandManager"),
        Commands           = app.getModule("command/Commands"),
        MenuManager        = app.getModule("menu/MenuManager"),
        ContextMenuManager = app.getModule("menu/ContextMenuManager"),
        ModelExplorerView  = app.getModule("explorer/ModelExplorerView"),
        DiagramManager     = app.getModule("diagrams/DiagramManager"),
        PreferenceManager  = app.getModule("core/PreferenceManager");

    var template = require("text!diagram-thumbnails-panel.html"),
        itemTemplate = require("text!diagram-thumbnails-item.html"),
        diagramThumbnailsPanel,
        listView,
        $diagramThumbnailsPanel,
        $listView,
        $title,
        $close,
        $button = $("<a id='toolbar-diagram-thumbnails-view' href='#' title='Diagram Thumbnails'></a>");

    var CMD_DIAGRAM_THUMBNAILS_VIEW = "view.diagramThumbnails",
        PREFERENCE_KEY              = "view.diagramThumbnails.visibility";

    var THUMBNAIL_WIDTH  = 120,
        THUMBNAIL_HEIGHT = 80;

    /**
     * DataSource for ListView
     * @type {kendo.data.DataSource}
     */
    var dataSource = new kendo.data.DataSource();

    /**
     * Clear all thumbnails
     */
    function _clearThumbnails() {
        dataSource.data([]);
    }

    /**
     * Add a thumbnail of diagram
     * @param {Diagram} diagram
     */
    function _addThumbnail(diagram) {
        dataSource.add({
            id: diagram._id,
            icon: diagram.getNodeIcon(),
            name: diagram.name,
            fullName: diagram.name + (diagram._parent ? " (from " + diagram._parent.name + ")" : ""),
            type: diagram.getClassName()
        });
    }

    /**
     * Paint thumbnail on canvas
     */
    function _paintThumbnail(diagram) {
        var canvasElement, canvas;

        canvasElement = document.getElementById("diagram-thumbnail-canvas-" + diagram._id);
        if (canvasElement) {
            canvasElement.width = THUMBNAIL_WIDTH;
            canvasElement.height = THUMBNAIL_HEIGHT;
            canvas = new Graphics.Canvas();
            canvas.context = canvasElement.getContext("2d");
            canvas.gridFactor = new Graphics.GridFactor(1.0, 1.0);
            canvas.zoomFactor = new Graphics.ZoomFactor(1.0, 1.0);

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

            // Paint Diagram
            var area   = diagram.getBoundingBox(),
                xr     = THUMBNAIL_WIDTH / (area.x2 + 20),
                yr     = THUMBNAIL_HEIGHT / (area.y2 + 20),
                scale  = Math.min(xr, yr);
            canvas.zoomFactor.numer = scale;
            canvas.context.clearRect(0, 0, canvasElement.width, canvasElement.height);
            diagram.drawDiagram(canvas, false);
        }
    }

    function _updateThumbnails() {
        _clearThumbnails();
        var diagrams = Repository.findAll(function (e) {
            return (e instanceof type.Diagram);
        });
        _.each(diagrams, function (dgm) {
            _addThumbnail(dgm);
        });
        _.defer(function () {
            _.each(diagrams, function (dgm) {
                _paintThumbnail(dgm);

                // click event
                var nameElement = document.getElementById("diagram-thumbnail-name-" + dgm._id);
                if (nameElement) {
                    $(nameElement).click(function () {
                        ModelExplorerView.select(dgm, true);
                        DiagramManager.setCurrentDiagram(dgm);
                        DiagramManager.scrollTo(0, 0, true);
                    });
                }

            });
        });
    }

    function _setupEvents() {
        $(Repository).on('created deleted', function (event, elems) {
            try {
                _.forEach(elems, function (elem) {
                    elem.traverse(function (e) {
                        if (e instanceof type.Diagram) {
                            _updateThumbnails();
                        }
                    });
                });
            } catch (err) {
                console.error(err);
            }
        });

        $(Repository).on('updated', function (event, elems) {
            try {
                _.forEach(elems, function (elem) {
                    if (elem instanceof type.Diagram) {
                        var nameElement = document.getElementById("diagram-thumbnail-name-" + elem._id);
                        if (nameElement) {
                            $(nameElement).text(elem.name);
                        }
                    }
                });
            } catch (err) {
                console.error(err);
            }
        });

        $(ProjectManager).on('projectCreated projectLoaded projectClosed imported', function (event) {
            try {
                _updateThumbnails();
            } catch (err) {
                console.error(err);
            }
        });

        $(DiagramManager).on('repaint', function (event, editor) {
            try {
                if (diagramThumbnailsPanel.isVisible()) {
                    _paintThumbnail(editor.diagram);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    /**
     * Show DiagramThumbnails Panel
     */
    function show() {
        diagramThumbnailsPanel.show();
        $button.addClass("selected");
        CommandManager.get(CMD_DIAGRAM_THUMBNAILS_VIEW).setChecked(true);
        PreferenceManager.set(PREFERENCE_KEY, true);
        _updateThumbnails();
    }

    /**
     * Hide DiagramThumbnails Panel
     */
    function hide() {
        diagramThumbnailsPanel.hide();
        $button.removeClass("selected");
        CommandManager.get(CMD_DIAGRAM_THUMBNAILS_VIEW).setChecked(false);
        PreferenceManager.set(PREFERENCE_KEY, false);
    }

    /**
     * Toggle DiagramThumbnails Panel
     */
    function toggle() {
        if (diagramThumbnailsPanel.isVisible()) {
            hide();
        } else {
            show();
        }
    }

    function _handleSelectDiagram() {
        if (listView.select().length > 0) {
            var data = dataSource.view(),
                item = data[listView.select().index()],
                dgm  = Repository.get(item.id);
            if (dgm) {
                ModelExplorerView.select(dgm, true);
                DiagramManager.setCurrentDiagram(dgm);
                DiagramManager.scrollTo(0, 0, true);
            }
        }
    }

    /**
     * Initialize Extension
     */
    function init() {
        // Load our stylesheet
        ExtensionUtils.loadStyleSheet(module, "styles.less");

        // Toolbar Button
        $("#toolbar .buttons").append($button);
        $button.click(function () {
            CommandManager.execute(CMD_DIAGRAM_THUMBNAILS_VIEW);
        });

        // Setup Diagram Thumbnails Panel
        $diagramThumbnailsPanel = $(template);
        $title = $diagramThumbnailsPanel.find(".title");
        $close = $diagramThumbnailsPanel.find(".close");
        $close.click(function () {
            hide();
        });
        diagramThumbnailsPanel = PanelManager.createBottomPanel("?", $diagramThumbnailsPanel, 29);

        // Setup Diagram Thumbnails List
        $listView = $diagramThumbnailsPanel.find(".listview");
        $listView.kendoListView({
            dataSource: dataSource,
            template: itemTemplate,
            selectable: true,
            change: function () {
                var data = dataSource.view(),
                    item = data[this.select().index()],
                    dgm  = Repository.get(item.id);
                if (dgm) {
                    SelectionManager.selectModel(dgm);
                }
            }
        });
        listView = $listView.data("kendoListView");
        $listView.dblclick(function (e) {
            _handleSelectDiagram();
        });

        // Register Commands
        CommandManager.register("Diagram Thumbnails", CMD_DIAGRAM_THUMBNAILS_VIEW, toggle);

        // Setup Menus
        var menu = MenuManager.getMenu(Commands.VIEW);
        menu.addMenuDivider();
        menu.addMenuItem(CMD_DIAGRAM_THUMBNAILS_VIEW, ["Ctrl-Alt-T"]);

        // Handle Events
        _setupEvents();

        // Load Preference
        var visible = PreferenceManager.get(PREFERENCE_KEY);
        if (visible === true) {
            show();
        } else {
            hide();
        }

    }

    // Initialize Extension
    init();

});

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
/*global $, _, define, app, Mustache, type */
define(function (require, exports, module) {
    "use strict";

    var Graphics           = app.getModule("core/Graphics"),
        ExtensionUtils     = app.getModule("utils/ExtensionUtils"),
        PanelManager       = app.getModule("utils/PanelManager"),
        Repository         = app.getModule("core/Repository"),
        SelectionManager   = app.getModule("engine/SelectionManager"),
        CommandManager     = app.getModule("command/CommandManager"),
        Commands           = app.getModule("command/Commands"),
        MenuManager        = app.getModule("menu/MenuManager"),
        DiagramManager     = app.getModule("diagrams/DiagramManager"),
        PreferenceManager  = app.getModule("core/PreferenceManager");

    var CMD_MINIMAP    = "view.minimap",
        PREFERENCE_KEY = "view.minimap.visibility",
        MINIMAP_WIDTH  = 120,
        MINIMAP_HEIGHT = 90;

    var $minimap = $("<canvas id='minimap'></canvas>"),
        $button  = $("<a id='toolbar-minimap' href='#' title='Minimap'></a>"),
        $diagramArea,
        currentDiagram,
        currentScale,
        canvasElement,
        canvas;

    /**
     * Show Minimap
     */
    function show() {
        $minimap.show();
        $button.addClass("selected");
        CommandManager.get(CMD_MINIMAP).setChecked(true);
        PreferenceManager.set(PREFERENCE_KEY, true);
        if (currentDiagram) {
            paintDiagram(currentDiagram);
        }
    }

    /**
     * Hide Minimap
     */
    function hide() {
        $minimap.hide();
        $button.removeClass("selected");
        CommandManager.get(CMD_MINIMAP).setChecked(false);
        PreferenceManager.set(PREFERENCE_KEY, false);
    }

    /**
     * Check Minimap's visible
     */
    function isVisible() {
        return $minimap.is(":visible");
    }

    /**
     * Toggle Minimap
     */
    function toggle() {
        if (isVisible()) {
            hide();
        } else {
            show();
        }
    }

    /**
     * Clear Minimap
     */
    function clear() {
        canvas.context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    /**
     * Draw Viewport
     */
    function drawViewport(scale) {
        var zoom = DiagramManager.getZoomLevel(),
            x = Math.floor(($diagramArea.scrollLeft() * scale) / zoom) + 0.5,
            y = Math.floor(($diagramArea.scrollTop() * scale) / zoom) + 0.5,
            w = Math.floor(($diagramArea.width() * scale) / zoom),
            h = Math.floor(($diagramArea.height() * scale) / zoom);
        if (w >= MINIMAP_WIDTH) { w = MINIMAP_WIDTH - 1; }
        if (h >= MINIMAP_HEIGHT) { h = MINIMAP_HEIGHT - 1; }
        canvas.context.save();
        canvas.context.beginPath();
        canvas.context.scale(canvas.ratio, canvas.ratio);
        canvas.context.strokeStyle = "#4f99ff";
        canvas.context.rect(x, y, w, h);
        canvas.context.stroke();
        canvas.context.restore();
    }

    /**
     * Paint diagram on Minimap
     */
    function paintDiagram(diagram) {
        if (isVisible()) {
            var area   = diagram.getBoundingBox(),
                vx     = $diagramArea.scrollLeft() + $diagramArea.width(), // viewport right
                vy     = $diagramArea.scrollTop() + $diagramArea.height(), // viewport bottom
                right  = Math.max(area.x2, vx),
                bottom = Math.max(area.y2, vy),
                xr     = MINIMAP_WIDTH / right,
                yr     = MINIMAP_HEIGHT / bottom,
                scale  = Math.min(xr, yr);
            currentScale = scale;
            canvas.zoomFactor.numer = currentScale;
            clear();
            diagram.drawDiagram(canvas, false);
            drawViewport(currentScale);
        }
    }

    function scrollTo(minimapX, minimapY, animation) {
        var x = Math.floor(minimapX / currentScale),
            y = Math.floor(minimapY / currentScale);
        DiagramManager.scrollTo(x, y, animation);
    }

    function initExtension() {
        // Load our stylesheet
        ExtensionUtils.loadStyleSheet(module, "styles.less");

        // Minimap
        $("#diagram-area-wrapper").append($minimap);
        var minimapDragging = false;
        $minimap.mousedown(function (event) {
            minimapDragging = true;
        });
        $minimap.mousemove(function (event) {
            if (minimapDragging) {
                scrollTo(event.offsetX, event.offsetY, false);
            }
        });
        $minimap.mouseup(function (event) {
            minimapDragging = false;
            scrollTo(event.offsetX, event.offsetY);
        });


        // Toolbar Button
        $("#toolbar .buttons").append($button);
        $button.click(function () {
            CommandManager.execute(CMD_MINIMAP);
        });

        // Minimap Canvas
        canvasElement = document.getElementById("minimap");
        canvasElement.width = MINIMAP_WIDTH;
        canvasElement.height = MINIMAP_HEIGHT;
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

        // Handle events for DiagramManager
        $(DiagramManager).on("repaint", function (event, editor) {
            try {
                currentDiagram = editor.diagram;
                paintDiagram(currentDiagram);
            } catch (err) {
                console.error(err);
            }
        });
        $(DiagramManager).on("currentDiagramChanged", function (event, diagram, editor) {
            try {
                if (diagram) {
                    currentDiagram = diagram;
                    paintDiagram(currentDiagram);
                } else {
                    currentDiagram = null;
                    clear();
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Handle events for $diagramArea
        $diagramArea = $("#diagram-area");
        $diagramArea.scroll(function (event) {
            if (currentDiagram) {
                paintDiagram(currentDiagram);
            }
        });

        // Register Commands
        CommandManager.register("Minimap", CMD_MINIMAP, toggle);

        // Setup Menus
        var menu = MenuManager.getMenu(Commands.VIEW);
        menu.addMenuDivider();
        menu.addMenuItem(CMD_MINIMAP, ["Ctrl-Alt-M"]);

        // Load Preference
        var visible = PreferenceManager.get(PREFERENCE_KEY);
        if (visible === true || visible === null) {
            show();
        } else {
            hide();
        }
    }

    // Initialization
    initExtension();

});


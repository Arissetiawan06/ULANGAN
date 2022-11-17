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
/*global define, $, _, window, app, type, appshell */
define(function (require, exports, module) {
    "use strict";

    var AppInit            = app.getModule("utils/AppInit"),
        Core               = app.getModule("core/Core"),
        Commands           = app.getModule("command/Commands"),
        CommandManager     = app.getModule("command/CommandManager"),
        MenuManager        = app.getModule("menu/MenuManager"),
        ContextMenuManager = app.getModule("menu/ContextMenuManager"),
        DefaultMenus       = app.getModule("menu/DefaultMenus"),
        OperationBuilder   = app.getModule("core/OperationBuilder"),
        Repository         = app.getModule("core/Repository"),
        SelectionManager   = app.getModule("engine/SelectionManager"),
        DiagramManager     = app.getModule("diagrams/DiagramManager");

    var CMD_FORMAT_ALIGNMENT                = 'format.alignment',
        CMD_FORMAT_ALIGNMENT_SEND_TO_BACK   = 'format.alignment.sendToBack',
        CMD_FORMAT_ALIGNMENT_BRING_TO_FRONT = 'format.alignment.bringToFront',
        CMD_FORMAT_ALIGNMENT_ALIGN_LEFT     = 'format.alignment.alignLeft',
        CMD_FORMAT_ALIGNMENT_ALIGN_RIGHT    = 'format.alignment.alignRight',
        CMD_FORMAT_ALIGNMENT_ALIGN_CENTER   = 'format.alignment.alignCenter',
        CMD_FORMAT_ALIGNMENT_ALIGN_TOP      = 'format.alignment.alignTop',
        CMD_FORMAT_ALIGNMENT_ALIGN_BOTTOM   = 'format.alignment.alignBottom',
        CMD_FORMAT_ALIGNMENT_ALIGN_MIDDLE   = 'format.alignment.alignMiddle',
        CMD_FORMAT_ALIGNMENT_SPACE_EQ_HORZ  = 'format.alignment.spaceEquallyHorizontally',
        CMD_FORMAT_ALIGNMENT_SPACE_EQ_VERT  = 'format.alignment.spaceEquallyVertically',
        CMD_FORMAT_ALIGNMENT_SET_WIDTH_EQ   = 'format.alignment.setWidthEqually',
        CMD_FORMAT_ALIGNMENT_SET_HEIGHT_EQ  = 'format.alignment.setHeightEqually',
        CMD_FORMAT_ALIGNMENT_SET_SIZE_EQ    = 'format.alignment.setSizeEqually';


    function _getNodeViews() {
        return _.filter(
            SelectionManager.getSelectedViews(),
            function (v) {
                return (v instanceof type.NodeView) &&
                      !(v instanceof type.EdgeParasiticView) &&
                      !(v instanceof type.NodeParasiticView);
            }
        );
    }

    function _handleSendToBack() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            OperationBuilder.begin("send to back");
            var selectedViews = SelectionManager.getSelectedViews();
            for (var i = selectedViews.length - 1; i >= 0; i--) {
                var view = selectedViews[i];
                OperationBuilder.fieldReorder(diagram, "ownedViews", view, 0);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleBringToFront() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            OperationBuilder.begin("bring to front");
            var lastPosition = diagram.ownedViews.length - 1,
                selectedViews = SelectionManager.getSelectedViews();
            for (var i = 0, len = selectedViews.length; i < len; i++) {
                var view = selectedViews[i];
                OperationBuilder.fieldReorder(diagram, "ownedViews", view, lastPosition);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignLeft() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var left = _.min(_.map(views, function (v) { return v.left; }));
            OperationBuilder.begin("align left");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "left", left);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignRight() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var right = _.max(_.map(views, function (v) { return v.getRight(); }));
            OperationBuilder.begin("align right");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "left", right - view.width + 1);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignCenter() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var left = _.min(_.map(views, function (v) { return v.left; })),
                right = _.max(_.map(views, function (v) { return v.getRight(); })),
                middle = Math.round((left + right) / 2);
            OperationBuilder.begin("align middle");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "left", middle - Math.round(view.width / 2));
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignTop() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var top = _.min(_.map(views, function (v) { return v.top; }));
            OperationBuilder.begin("align top");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "top", top);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignBottom() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var bottom = _.max(_.map(views, function (v) { return v.getBottom(); }));
            OperationBuilder.begin("align bottom");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "top", bottom - view.height + 1);
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleAlignMiddle() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _getNodeViews();
            var top = _.min(_.map(views, function (v) { return v.top; })),
                bottom = _.max(_.map(views, function (v) { return v.getBottom(); })),
                center = Math.round((top + bottom) / 2);
            OperationBuilder.begin("align bottom");
            for (var i = 0, len = views.length; i < len; i++) {
                var view = views[i];
                OperationBuilder.fieldAssign(view, "top", center - Math.round(view.height / 2));
            }
            OperationBuilder.end();
            Repository.doOperation(OperationBuilder.getOperation());
            DiagramManager.repaint();
        }
    }

    function _handleSpaceEquallyHorz() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _.sortBy(_getNodeViews(), function (v) { return v.left; });
            var left = _.min(_.map(views, function (v) { return v.left; })),
                right = _.max(_.map(views, function (v) { return v.getRight(); })),
                w = _.reduce(_.map(views, function (v) { return v.width; }), function (a, b) { return a + b; });
            if ((right - left) > w) {
                var x = Math.round(left),
                    interval = ((right - left) - w) / (views.length - 1);
                OperationBuilder.begin("space equally, horizontally");
                for (var i = 0, len = views.length; i < len; i++) {
                    var view = views[i];
                    OperationBuilder.fieldAssign(view, "left", x);
                    x = Math.round(x + view.width + interval);
                }
                OperationBuilder.end();
                Repository.doOperation(OperationBuilder.getOperation());
                DiagramManager.repaint();
            }
        }
    }

    function _handleSpaceEquallyVert() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views = _.sortBy(_getNodeViews(), function (v) { return v.top; });
            var top = _.min(_.map(views, function (v) { return v.top; })),
                bottom = _.max(_.map(views, function (v) { return v.getBottom(); })),
                h = _.reduce(_.map(views, function (v) { return v.height; }), function (a, b) { return a + b; });
            if ((bottom - top) > h) {
                var y = Math.round(top),
                    interval = ((bottom - top) - h) / (views.length - 1);
                OperationBuilder.begin("space equally, vertically");
                for (var i = 0, len = views.length; i < len; i++) {
                    var view = views[i];
                    OperationBuilder.fieldAssign(view, "top", y);
                    y = Math.round(y + view.height + interval);
                }
                OperationBuilder.end();
                Repository.doOperation(OperationBuilder.getOperation());
                DiagramManager.repaint();
            }
        }
    }

    function _handleSetWidthEqually() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views    = _getNodeViews();
            if (views.length > 0) {
                var maxWidth = _.max(_.map(views, function (v) { return v.width; }));
                OperationBuilder.begin("set width equally");
                for (var i = 0, len = views.length; i < len; i++) {
                    var view = views[i];
                    OperationBuilder.fieldAssign(view, "width", maxWidth);
                }
                OperationBuilder.end();
                Repository.doOperation(OperationBuilder.getOperation());
                DiagramManager.repaint();
            }
        }
    }

    function _handleSetHeightEqually() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views    = _getNodeViews();
            if (views.length > 0) {
                var maxHeight = _.max(_.map(views, function (v) { return v.height; }));
                OperationBuilder.begin("set height equally");
                for (var i = 0, len = views.length; i < len; i++) {
                    var view = views[i];
                    OperationBuilder.fieldAssign(view, "height", maxHeight);
                }
                OperationBuilder.end();
                Repository.doOperation(OperationBuilder.getOperation());
                DiagramManager.repaint();
            }
        }
    }

    function _handleSetSizeEqually() {
        var diagram = DiagramManager.getCurrentDiagram();
        if (diagram) {
            var views    = _getNodeViews();
            if (views.length > 0) {
                var maxWidth  = _.max(_.map(views, function (v) { return v.width; })),
                    maxHeight = _.max(_.map(views, function (v) { return v.height; }));
                OperationBuilder.begin("set size equally");
                for (var i = 0, len = views.length; i < len; i++) {
                    var view = views[i];
                    OperationBuilder.fieldAssign(view, "width", maxWidth);
                    OperationBuilder.fieldAssign(view, "height", maxHeight);
                }
                OperationBuilder.end();
                Repository.doOperation(OperationBuilder.getOperation());
                DiagramManager.repaint();
            }
        }
    }

    function _updateCommands() {
        var views = SelectionManager.getSelectedViews();
        CommandManager.get(CMD_FORMAT_ALIGNMENT).setEnabled(views.length > 0);
    }

    // Register Commands
    CommandManager.register("Alignment",      CMD_FORMAT_ALIGNMENT,                CommandManager.doNothing);
    CommandManager.register("Send to Back",   CMD_FORMAT_ALIGNMENT_SEND_TO_BACK,   _handleSendToBack);
    CommandManager.register("Bring to Front", CMD_FORMAT_ALIGNMENT_BRING_TO_FRONT, _handleBringToFront);
    CommandManager.register("Align Left",     CMD_FORMAT_ALIGNMENT_ALIGN_LEFT,     _handleAlignLeft);
    CommandManager.register("Align Right",    CMD_FORMAT_ALIGNMENT_ALIGN_RIGHT,    _handleAlignRight);
    CommandManager.register("Align Center",   CMD_FORMAT_ALIGNMENT_ALIGN_CENTER,   _handleAlignCenter);
    CommandManager.register("Align Top",      CMD_FORMAT_ALIGNMENT_ALIGN_TOP,      _handleAlignTop);
    CommandManager.register("Align Bottom",   CMD_FORMAT_ALIGNMENT_ALIGN_BOTTOM,   _handleAlignBottom);
    CommandManager.register("Align Middle",   CMD_FORMAT_ALIGNMENT_ALIGN_MIDDLE,   _handleAlignMiddle);
    CommandManager.register("Space Equally, Horizontally", CMD_FORMAT_ALIGNMENT_SPACE_EQ_HORZ, _handleSpaceEquallyHorz);
    CommandManager.register("Space Equally, Vertically",   CMD_FORMAT_ALIGNMENT_SPACE_EQ_VERT, _handleSpaceEquallyVert);
    CommandManager.register("Set Width Equally",  CMD_FORMAT_ALIGNMENT_SET_WIDTH_EQ,  _handleSetWidthEqually);
    CommandManager.register("Set Height Equally", CMD_FORMAT_ALIGNMENT_SET_HEIGHT_EQ, _handleSetHeightEqually);
    CommandManager.register("Set Size Equally",   CMD_FORMAT_ALIGNMENT_SET_SIZE_EQ,   _handleSetSizeEqually);

    var menu, menuItem;
    // Setup Menus
    menu = MenuManager.getMenu(Commands.FORMAT);
    menu.addMenuDivider();
    menuItem = menu.addMenuItem(CMD_FORMAT_ALIGNMENT);
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SEND_TO_BACK, null, null, null, "tool-icon-sendtoback");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_BRING_TO_FRONT, null, null, null, "tool-icon-bringtofront");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_LEFT, null, null, null, "tool-icon-align-left");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_CENTER, null, null, null, "tool-icon-align-center");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_RIGHT, null, null, null, "tool-icon-align-right");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_TOP, null, null, null, "tool-icon-align-top");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_MIDDLE, null, null, null, "tool-icon-align-middle");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_BOTTOM, null, null, null, "tool-icon-align-bottom");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SPACE_EQ_HORZ, null, null, null, "tool-icon-align-space-even-horz");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SPACE_EQ_VERT, null, null, null, "tool-icon-align-space-even-vert");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_WIDTH_EQ, null, null, null, "tool-icon-set-width-equal");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_HEIGHT_EQ, null, null, null, "tool-icon-set-height-equal");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_SIZE_EQ, null, null, null, "tool-icon-set-size-equal");

    // Setup Context Menus
    menu = ContextMenuManager.getContextMenu(DefaultMenus.contextMenus.DIAGRAM);
    menu.addMenuDivider();
    menuItem = menu.addMenuItem(CMD_FORMAT_ALIGNMENT);
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SEND_TO_BACK, "tool-icon-sendtoback");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_BRING_TO_FRONT, "tool-icon-bringtofront");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_LEFT, "tool-icon-align-left");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_CENTER, "tool-icon-align-center");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_RIGHT, "tool-icon-align-right");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_TOP, "tool-icon-align-top");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_MIDDLE, "tool-icon-align-middle");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_ALIGN_BOTTOM, "tool-icon-align-bottom");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SPACE_EQ_HORZ, "tool-icon-align-space-even-horz");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SPACE_EQ_VERT, "tool-icon-align-space-even-vert");
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_WIDTH_EQ,  "tool-icon-set-width-equal");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_HEIGHT_EQ, "tool-icon-set-height-equal");
    menuItem.addMenuItem(CMD_FORMAT_ALIGNMENT_SET_SIZE_EQ,   "tool-icon-set-size-equal");

    // Update Commands
    $(SelectionManager).on("selectionChanged", _updateCommands);
    $(Repository).on("operationExecuted", _updateCommands);

});

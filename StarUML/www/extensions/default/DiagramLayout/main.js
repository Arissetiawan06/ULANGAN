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
/*global $, define, app, _, type */
define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils   = app.getModule("utils/ExtensionUtils"),
        NodeDomain       = app.getModule("utils/NodeDomain"),
        FileUtils        = app.getModule("file/FileUtils"),
        FileSystem       = app.getModule("filesystem/FileSystem"),
        Core             = app.getModule("core/Core"),
        OperationBuilder = app.getModule("core/OperationBuilder"),
        Repository       = app.getModule("core/Repository"),
        Engine           = app.getModule("engine/Engine"),
        SelectionManager = app.getModule("engine/SelectionManager"),
        Graphics         = app.getModule("core/Graphics"),
        Commands         = app.getModule("command/Commands"),
        CommandManager   = app.getModule("command/CommandManager"),
        MenuManager      = app.getModule("menu/MenuManager"),
        DiagramManager   = app.getModule("diagrams/DiagramManager"),
        Dialogs          = app.getModule("dialogs/Dialogs"),
        UMLUtils         = app.getModule("uml/UMLUtils");

    var CMD_FORMAT_LAYOUT               = 'format.layout',
        CMD_FORMAT_LAYOUT_AUTO          = 'format.layout.auto',
        CMD_FORMAT_LAYOUT_TOP_TO_BOTTOM = 'format.layout.topToBottom',
        CMD_FORMAT_LAYOUT_BOTTOM_TO_TOP = 'format.layout.bottomToTop',
        CMD_FORMAT_LAYOUT_LEFT_TO_RIGHT = 'format.layout.leftToRight',
        CMD_FORMAT_LAYOUT_RIGHT_TO_LEFT = 'format.layout.RightToLeft';

    /**
     * @param {string} direction - See Core.DIRECTION_TB, ...
     * @param {{node:number, edge:number, rank:number}} separations
     */
    function _handleLayout(direction, separations) {
        if (DiagramManager.getCurrentDiagram()) {
            Engine.layoutDiagram(DiagramManager.getEditor(), DiagramManager.getCurrentDiagram(), direction, separations);
            DiagramManager.repaint();
        }
    }


    // Register Commands
    CommandManager.register("Layout",          CMD_FORMAT_LAYOUT,               CommandManager.doNothing);
    CommandManager.register("Auto",            CMD_FORMAT_LAYOUT_AUTO,          _handleLayout);
    CommandManager.register("Top to Bottom",   CMD_FORMAT_LAYOUT_TOP_TO_BOTTOM, _.partial(_handleLayout, Core.DIRECTION_TB));
    CommandManager.register("Bottom to Top",   CMD_FORMAT_LAYOUT_BOTTOM_TO_TOP, _.partial(_handleLayout, Core.DIRECTION_BT));
    CommandManager.register("Left to Right",   CMD_FORMAT_LAYOUT_LEFT_TO_RIGHT, _.partial(_handleLayout, Core.DIRECTION_LR));
    CommandManager.register("Right to Left",   CMD_FORMAT_LAYOUT_RIGHT_TO_LEFT, _.partial(_handleLayout, Core.DIRECTION_RL));

    // Setup Menus
    var menu = MenuManager.getMenu(Commands.FORMAT);
    var menuItem = menu.addMenuItem(CMD_FORMAT_LAYOUT);
    menuItem.addMenuItem(CMD_FORMAT_LAYOUT_AUTO);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_FORMAT_LAYOUT_TOP_TO_BOTTOM);
    menuItem.addMenuItem(CMD_FORMAT_LAYOUT_BOTTOM_TO_TOP);
    menuItem.addMenuItem(CMD_FORMAT_LAYOUT_LEFT_TO_RIGHT);
    menuItem.addMenuItem(CMD_FORMAT_LAYOUT_RIGHT_TO_LEFT);

});

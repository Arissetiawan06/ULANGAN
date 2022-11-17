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
/*global $, define, app, appshell, C2S */
define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = app.getModule("utils/ExtensionUtils"),
        NodeDomain     = app.getModule("utils/NodeDomain"),
        FileUtils      = app.getModule("file/FileUtils"),
        FileSystem     = app.getModule("filesystem/FileSystem"),
        Graphics       = app.getModule("core/Graphics"),
        Repository     = app.getModule("core/Repository"),
        Commands       = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        MenuManager    = app.getModule("menu/MenuManager"),
        DiagramManager = app.getModule("diagrams/DiagramManager"),
        Dialogs        = app.getModule("dialogs/Dialogs"),
        NodeDebugUtils = require("NodeDebugUtils");

    var CMD_DEBUG                      = 'debug',
        CMD_DEBUG_RELOAD               = 'debug.reload',
        CMD_DEBUG_SHOW_DEVTOOLS        = 'debug.showDevTools',
        CMD_DEBUG_ENABLE_NODE_DEBUGGER = 'debug.enableNodeDebugger',
        CMD_DEBUG_LOG_NODE_STATE       = 'debug.logNodeState',
        CMD_DEBUG_RESTART_NODE         = 'debug.restartNode',
        CMD_DEBUG_RUN_TEST             = 'debug.runTests',
        CMD_DEBUG_RUN_MANUAL_TEST      = 'debug.runManualTests';

    function _handleReload() {
        if (Repository.isModified()) {
            Dialogs.showConfirmDialog(
                "Do you want to refresh without save changes?"
            ).done(function (buttonId) {
                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                    CommandManager.execute(Commands.APP_RELOAD);
                }
            });
        } else {
            CommandManager.execute(Commands.APP_RELOAD);
        }
    }

    function _handleShowDevTools() {
        appshell.app.showDeveloperTools();
    }

    // TODO: TEST
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var _testWindow = null;
    function _handleRunTests(spec) {
        var queryString = spec ? "?spec=" + spec : "";
        if (_testWindow) {
            try {
                if (_testWindow.location.search !== queryString) {
                    _testWindow.location.href = "../test/SpecRunner.html" + queryString;
                } else {
                    _testWindow.location.reload(true);
                }
            } catch (e) {
                _testWindow = null;  // the window was probably closed
            }
        }

        if (!_testWindow) {
            _testWindow = window.open("../test/SpecRunner.html" + queryString, "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
            _testWindow.location.reload(true); // if it was opened before, we need to reload because it will be cached
        }
    }

    var _manualTestWindow = null;
    function _handleRunManualTests() {
        _manualTestWindow = window.open("../test/ManualTestRunner.html", "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
        _manualTestWindow.location.reload(true); // if it was opened before, we need to reload because it will be cached
    }

    // Register Commands
    CommandManager.register("Debug",                CMD_DEBUG,               CommandManager.doNothing);
    CommandManager.register("Show DevTools",        CMD_DEBUG_SHOW_DEVTOOLS, _handleShowDevTools);
    CommandManager.register("Reload",               CMD_DEBUG_RELOAD,        _handleReload);

    // Node-related Commands
    CommandManager.register("Enable Node Debugger", CMD_DEBUG_ENABLE_NODE_DEBUGGER,   NodeDebugUtils.enableDebugger);
    CommandManager.register("Log Node State",       CMD_DEBUG_LOG_NODE_STATE,         NodeDebugUtils.logNodeState);
    CommandManager.register("Restart Node",         CMD_DEBUG_RESTART_NODE,           NodeDebugUtils.restartNode);

    // Test-related Commands
    CommandManager.register("Run Tests",            CMD_DEBUG_RUN_TEST,      _handleRunTests);
    CommandManager.register("Run Manual Tests",     CMD_DEBUG_RUN_MANUAL_TEST, _handleRunManualTests);

    // Setup Menus
    var menu = MenuManager.addMenu(CMD_DEBUG, MenuManager.AFTER, Commands.VIEW);
    menu.addMenuItem(CMD_DEBUG_SHOW_DEVTOOLS, ["Shift-Alt-T"]);
    menu.addMenuItem(CMD_DEBUG_RELOAD, ["Ctrl-R"]);
    menu.addMenuDivider();
    menu.addMenuItem(CMD_DEBUG_ENABLE_NODE_DEBUGGER);
    menu.addMenuItem(CMD_DEBUG_LOG_NODE_STATE);
    menu.addMenuItem(CMD_DEBUG_RESTART_NODE, ["Shift-Alt-R"]);

    // Add Run Test menus only if '/test' directory exists
    if (app.devMode) {
        menu.addMenuDivider();
        menu.addMenuItem(CMD_DEBUG_RUN_TEST);
        menu.addMenuItem(CMD_DEBUG_RUN_MANUAL_TEST);
    }
});

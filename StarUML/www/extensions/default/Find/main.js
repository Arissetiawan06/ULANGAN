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

    var Repository        = app.getModule("core/Repository"),
        Commands          = app.getModule("command/Commands"),
        CommandManager    = app.getModule("command/CommandManager"),
        MenuManager       = app.getModule("menu/MenuManager"),
        ModelExplorerView = app.getModule("explorer/ModelExplorerView"),
        KeyEvent          = app.getModule("utils/KeyEvent"),
        Dialogs           = app.getModule("dialogs/Dialogs"),
        Strings           = app.getModule("strings"),
        PanelManager      = app.getModule("utils/PanelManager"),
        ExtensionUtils    = app.getModule("utils/ExtensionUtils"),
        findDialogTemplate      = require("text!find-dialog.html"),
        findResultPanelTemplate = require("text!find-result-panel.html");

    var $findResultPanel,
        $title,
        $close,
        $listView;

    var findResultPanel;

    /**
     * DataSource for ListView
     * @type {kendo.data.DataSource}
     */
    var dataSource = new kendo.data.DataSource();

    /**
     * Find Menu ID
     */
    var CMD_MODEL_FIND = 'model.find';

    /**
     * Show Find Dialog
     * @return {$.Promise}
     */
    function showFindDialog() {
        var context = { Strings: Strings };
        var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(findDialogTemplate, context), true, function ($dlg) {
            var val = {
                keyword             : $dlg.find(".keyword").val(),
                caseSensitive       : $dlg.find(".case-sensitive").is(":checked"),
                findInDocumentation : $dlg.find(".find-in-documentation").is(":checked")
            };
            $dlg.data("returnValue", val);
        });
        var $dlg = dialog.getElement(),
            $keyword = $dlg.find(".keyword");
        // Focus on keyword input
        $keyword.focus();

        // Keydown Event
        // TODO: This is temporal implementation.
        // Please refer to KeyBindingManager.js of Brackets' implementation
        $keyword.keydown(function (event) {
            switch (event.which) {
            case KeyEvent.DOM_VK_RETURN:
                $dlg.find(".primary").click();
                break;
            }
        });
        return dialog;
    }

    /**
     * Find elements
     * @param {string} keyword
     * @param {boolean} caseSensitive
     * @param {boolean} findInDocumentation
     */
    function findElements(keyword, caseSensitive, findInDocumentation) {
        var elements = Repository.findAll(function (elem) {
            if (keyword.trim() === "") {
                return false;
            }
            if (elem instanceof type.Model) {
                var searchTarget = elem.name;
                if (findInDocumentation && typeof elem.documentation === "string") {
                    searchTarget += "\n" + elem.documentation;
                }
                if (!caseSensitive) {
                    searchTarget = searchTarget.toLowerCase();
                    keyword = keyword.toLowerCase();
                }
                if (searchTarget.indexOf(keyword) > -1) {
                    return true;
                }
            }
            return false;
        });
        return elements;
    }

    function _clearItems() {
        dataSource.data([]);
    }

    function _addItem(element) {
        dataSource.add({
            elementId: element._id,
            elementIcon: element.getNodeIcon(),
            elementName: element.getPathname()
        });
    }

    function _handleFind() {
        showFindDialog().done(function (buttonId, result) {
            var i, len;
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                _clearItems();
                var found = findElements(result.keyword, result.caseSensitive, result.findInDocumentation);
                for (i = 0, len = found.length; i < len; i++) {
                    _addItem(found[i]);
                }
                $title.html('Find Results "' + result.keyword + '" — ' + found.length + " elements.");
                findResultPanel.show();
            }
        });
    }

    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "styles.less");

    // Setup Find Result Panel
    $findResultPanel = $(findResultPanelTemplate);
    $title = $findResultPanel.find(".title");
    $close = $findResultPanel.find(".close");
    $close.click(function () {
        findResultPanel.hide();
    });
    $listView = $findResultPanel.find(".listview");
    findResultPanel = PanelManager.createBottomPanel("?",$findResultPanel , 29);
    $listView.kendoListView({
        dataSource: dataSource,
        template: "<div><span><span class='k-sprite #=elementIcon#'></span>#:elementName#</span></div>",
        selectable: true,
        change: function () {
            var data = dataSource.view(),
                item = data[this.select().index()],
                element = Repository.get(item.elementId);
            if (element) {
                ModelExplorerView.select(element, true);
            }
        }
    });

    // Register Commands
    CommandManager.register("Find...", CMD_MODEL_FIND, _handleFind);

    // Setup Menus
    var menu = MenuManager.getMenu(Commands.MODEL);
    menu.addMenuDivider();
    menu.addMenuItem(CMD_MODEL_FIND, ["Ctrl-F"]);
    // FIXME: Shortcut Ctrl-F is not working

});
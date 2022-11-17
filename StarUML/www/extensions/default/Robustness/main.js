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

define(function (require, exports, module) {
    "use strict";

    var AppInit        = app.getModule("utils/AppInit"),
        Core           = app.getModule("core/Core"),
        Commands       = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        Repository     = app.getModule("core/Repository"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        Engine         = app.getModule("engine/Engine"),
        Factory        = app.getModule("engine/Factory"),
        Dialogs        = app.getModule("dialogs/Dialogs"),
        Toolbox        = app.getModule("diagrams/ToolboxView"),
        UML            = app.getModule("uml/UML"),
        UMLCommands    = app.getModule("uml/UMLCommands");

    /**
     * Toolbox Group
     * @const
     */
    var TXG_ROBUSTNESS = 'txg-robustness';

    /**
     * Toolbox Items
     * @const
     */
    var TX_BOUNDARY    = 'tx-robustness-boundary',
        TX_ENTITY      = 'tx-robustness-entity',
        TX_CONTROL     = 'tx-robustness-control';


    function _addClass(diagram, parent, name, stereotype, x1, y1, x2, y2) {
        var model = new type.UMLClass();
        model.name = Core.getNewName(parent.ownedElements, name);
        model.stereotype = stereotype;
        var view = new type.UMLClassView();
        view.suppressAttributes = true;
        view.suppressOperations = true;
        view.stereotypeDisplay = UML.SD_ICON;
        view.initialize(null, x1, y1, x2, y2);
        Engine.addModelAndView(diagram, model, view, parent, 'ownedElements');
    }

    /**
     * Setup Toolbox
     */
    function setupToolbox() {
        Toolbox.addGroup(TXG_ROBUSTNESS, 'Robustness', [type.UMLClassDiagram]);
        Toolbox.addItem(TX_BOUNDARY, TXG_ROBUSTNESS, 'Boundary', 'icon-UMLBoundary', 'rect');
        Toolbox.addItem(TX_ENTITY,   TXG_ROBUSTNESS, 'Entity',   'icon-UMLEntity',   'rect');
        Toolbox.addItem(TX_CONTROL,  TXG_ROBUSTNESS, 'Control',  'icon-UMLControl',  'rect');
        // Event Handling
        $(Toolbox).on('elementCreated', function (event, id, editor, x1, y1, x2, y2) {
            try {
                var diagram    = editor.diagram,
                    parent     = diagram._parent,
                    stereotype = null;
                switch (id) {
                case TX_BOUNDARY:
                    stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "boundary", type.UMLStereotype);
                    if (stereotype) {
                        _addClass(diagram, parent, "Boundary", stereotype, x1, y1, x2, y2);
                    } else {
                        Dialogs.showConfirmDialog("Boundary requires UML Standard Profile. Do you want to apply?")
                            .done(function (buttonId) {
                                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                                    CommandManager.execute(UMLCommands.MODEL_APPLY_PROFILE_UML_STANDARD)
                                        .done(function () {
                                            stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "boundary", type.UMLStereotype);
                                            _addClass(diagram, parent, "Boundary", stereotype, x1, y1, x2, y2);
                                        });
                                }
                            });
                    }
                    break;
                case TX_ENTITY:
                    stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "entity", type.UMLStereotype);
                    if (stereotype) {
                        _addClass(diagram, parent, "Entity", stereotype, x1, y1, x2, y2);
                    } else {
                        Dialogs.showConfirmDialog("Entity requires UML Standard Profile. Do you want to apply?")
                            .done(function (buttonId) {
                                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                                    CommandManager.execute(UMLCommands.MODEL_APPLY_PROFILE_UML_STANDARD)
                                        .done(function () {
                                            stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "entity", type.UMLStereotype);
                                            _addClass(diagram, parent, "Entity", stereotype, x1, y1, x2, y2);
                                        });
                                }
                            });
                    }
                    break;
                case TX_CONTROL:
                    stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "control", type.UMLStereotype);
                    if (stereotype) {
                        _addClass(diagram, parent, "Control", stereotype, x1, y1, x2, y2);
                    } else {
                        Dialogs.showConfirmDialog("Control requires UML Standard Profile. Do you want to apply?")
                            .done(function (buttonId) {
                                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                                    CommandManager.execute(UMLCommands.MODEL_APPLY_PROFILE_UML_STANDARD)
                                        .done(function () {
                                            stereotype = Repository.lookupAndFind(ProjectManager.getProject(), "control", type.UMLStereotype);
                                            _addClass(diagram, parent, "Control", stereotype, x1, y1, x2, y2);
                                        });
                                }
                            });
                    }
                    break;
                }
            } catch (err) {
                if (_.isString(err)) {
                    Dialogs.showAlertDialog(err);
                } else {
                    console.log(err.stack);
                }
            }
        });
    }

    setupToolbox();

});

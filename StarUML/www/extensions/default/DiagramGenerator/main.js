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
        Graphics         = app.getModule("core/Graphics"),
        Repository       = app.getModule("core/Repository"),
        OperationBuilder = app.getModule("core/OperationBuilder"),
        MetaModelManager = app.getModule("core/MetaModelManager"),
        Engine           = app.getModule("engine/Engine"),
        SelectionManager = app.getModule("engine/SelectionManager"),
        Commands         = app.getModule("command/Commands"),
        CommandManager   = app.getModule("command/CommandManager"),
        MenuManager      = app.getModule("menu/MenuManager"),
        DiagramManager   = app.getModule("diagrams/DiagramManager"),
        Dialogs          = app.getModule("dialogs/Dialogs"),
        UML              = app.getModule("uml/UML"),
        UMLCommands      = app.getModule("uml/UMLCommands");

    var CMD_DIAGRAM_GENERATOR                   = 'diagramGenerator',
        CMD_DIAGRAM_GENERATOR_OVERVIEW          = 'diagramGenerator.overview',
        CMD_DIAGRAM_GENERATOR_OVERVIEW_EXPANDED = 'diagramGenerator.overview.expanded',
        CMD_DIAGRAM_GENERATOR_TYPE_HIERARCHY    = 'diagramGenerator.typeHierarchy',
        CMD_DIAGRAM_GENERATOR_PACKAGE_STRUCTURE = 'diagramGenerator.packageStructure';

    /**
     * Create a View of a given model
     * @param {Model} model
     * @param {Object} options
     * @return {View}
     */
    function createViewOf(model, options) {
        var ViewType = model.getViewType();
        if (ViewType) {
            var view = new ViewType();
            view.model = model;
            // Defaults
            if (view instanceof type.UMLInterfaceView) {
                view.stereotypeDisplay = UML.SD_ICON;
            }
            // Set options
            if (options) {
                var key;
                for (key in options) {
                    if (options.hasOwnProperty(key) && view.hasOwnProperty(key)) {
                        view[key] = options[key];
                    }
                }
            }
            return view;
        }
        return null;
    }

    /**
     * Return edge views of a given view in a diagram
     * @param {Diagram} diagram
     * @param {View} view
     * @param {?constructor} edgeViewType - create views only of this type
     * @return {Array.<EdgeView>}
     */
    // TODO: uml/main의 addViewAndRelations 함수와 공통부분이 많음.
    function createEdgeViewsOf(diagram, view, edgeViewType) {
        var i, len,
            model = view.model,
            edgeViews = [],
            relations = Repository.getRelationshipsOf(model);

        for (i = 0, len = relations.length; i < len; i++) {
            var j, len2, v,
                rel = relations[i],
                EdgeType = rel.getViewType(),
                edgeView;

            // If type is mismatched, skip to next iteration
            if (edgeViewType && edgeViewType !== EdgeType) {
                continue;
            }

            if (EdgeType) {
                // for Directed Relationships
                if (rel instanceof type.DirectedRelationship) {
                    for (j = 0, len2 = diagram.ownedViews.length; j < len2; j++) {
                        v = diagram.ownedViews[j];
                        // from view to v
                        if ((v.model === rel.target) && (model === rel.source)) {
                            edgeView = new EdgeType();
                            edgeView.model = rel;
                            edgeView.tail = view;
                            edgeView.head = v;
                            edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                            edgeViews.push(edgeView);
                        // from v to view
                        } else if ((v.model === rel.source) && (model === rel.target)) {
                            edgeView = new EdgeType();
                            edgeView.model = rel;
                            edgeView.tail = v;
                            edgeView.head = view;
                            edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                            edgeViews.push(edgeView);
                        }
                    }
                    // for self-link
                    if ((rel.source === rel.target) && (rel.source === model)) {
                        edgeView = new EdgeType();
                        edgeView.model = rel;
                        edgeView.tail = view;
                        edgeView.head = view;
                        edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                        edgeViews.push(edgeView);
                    }
                // for Undirected Relationships
                } else if (rel instanceof type.UndirectedRelationship) {
                    for (j = 0, len2 = diagram.ownedViews.length; j < len2; j++) {
                        v = diagram.ownedViews[j];
                        if ((v.model === rel.end2.reference) && (model === rel.end1.reference)) {
                            edgeView = new EdgeType();
                            edgeView.model = rel;
                            edgeView.tail = view;
                            edgeView.head = v;
                            edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                            edgeViews.push(edgeView);
                        } else if ((v.model === rel.end1.reference) && (model === rel.end2.reference)) {
                            edgeView = new EdgeType();
                            edgeView.model = rel;
                            edgeView.tail = v;
                            edgeView.head = view;
                            edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                            edgeViews.push(edgeView);
                        }
                    }
                    // for self-link
                    if ((rel.end1.reference === rel.end2.reference) && (rel.end1.reference === model)) {
                        edgeView = new EdgeType();
                        edgeView.model = rel;
                        edgeView.tail = view;
                        edgeView.head = view;
                        edgeView.initialize(null, edgeView.tail.left, edgeView.tail.top, edgeView.head.left, edgeView.head.top);
                        edgeViews.push(edgeView);
                    }
                }
            }
        }
        return edgeViews;
    }


    function _addDiagram(base, diagram) {
        OperationBuilder.begin('add diagram');
        OperationBuilder.insert(diagram);
        OperationBuilder.fieldInsert(base, "ownedElements", diagram);
        OperationBuilder.end();
        var cmd = OperationBuilder.getOperation();
        Repository.doOperation(cmd);
        return Repository.get(diagram._id);
    }

    function _layoutDiagram(diagram, direction, separation) {
        var hiddenEditor = DiagramManager.getHiddenEditor();
        hiddenEditor.diagram = diagram;
        hiddenEditor.repaint();
        hiddenEditor.repaint(); // why should I run it twice?
        Engine.layoutDiagram(hiddenEditor, diagram, direction, separation);
        hiddenEditor.repaint();
    }

    /**
     * Create Overview Diagram of a given package (or namespace)
     * @param {Element} base
     * @param {boolean} suppressCompartments
     * @param {boolean} doNotOpen
     */
    function _handleOverview(base, suppressCompartments, doNotOpen) {
        if (!base) {
            var selected = SelectionManager.getSelected();
            if (selected instanceof type.UMLPackage) {
                base = selected;
            }
        }
        if (base) {
            // Create Overview Diagram
            var diagram = new type.UMLClassDiagram();
            diagram._parent = base;
            diagram.name = "Overview";
            var i, len, elem, view;
            for (i = 0, len = base.ownedElements.length; i < len; i++) {
                elem = base.ownedElements[i];
                view = createViewOf(elem);
                if (view) {
                    // Suppress Compartments
                    if (suppressCompartments) {
                        if (typeof view.suppressAttributes !== "undefined") {
                            view.suppressAttributes = true;
                        }
                        if (typeof view.suppressOperations !== "undefined") {
                            view.suppressOperations = true;
                        }
                        if (typeof view.suppressLiterals !== "undefined") {
                            view.suppressLiterals = true;
                        }
                    }

                    // add node views
                    diagram.addOwnedView(view);
                    // add edge views
                    var edgeViews = createEdgeViewsOf(diagram, view);
                    for (var j = 0, len2 = edgeViews.length; j < len2; j++) {
                        diagram.addOwnedView(edgeViews[j]);
                    }

                }
            }
            // Add Diagram
            diagram = _addDiagram(base, diagram);

            // Layout Diagram
            _layoutDiagram(diagram);

            // Open Diagram
            if (!doNotOpen) {
                DiagramManager.openDiagram(diagram);
                DiagramManager.repaint();
            }

        } else {
            Dialogs.showInfoDialog("To generate overview diagram, select a Package.");
        }
    }

    function _handleOverviewSuppressed(base, doNotOpen) {
        _handleOverview(base, true, doNotOpen);
    }

    function _handleOverviewExpanded(base, doNotOpen) {
        _handleOverview(base, false, doNotOpen);
    }

    /**
     * Create Type Hierarchy Diagram
     * @param {Element} base
     * @param {boolean} doNotOpen
     */
    function _handleTypeHierarchy(base, doNotOpen) {

        function _isType(elem) {
            return (elem instanceof type.UMLClass) ||
                (elem instanceof type.UMLInterface) ||
                (elem instanceof type.UMLEnumeration) ||
                (elem instanceof type.UMLSignal) ||
                (elem instanceof type.UMLDataType);
        }

        if (!base) {
            var selected = SelectionManager.getSelected();
            if (selected instanceof type.UMLPackage) {
                base = selected;
            }
        }
        if (base) {
            // Collect all types in base element
            var allTypes = [];
            base.traverse(function (elem) {
                if (_isType(elem)) {
                    allTypes.push(elem);
                }
            });

            // Create Type Hierarchy Diagram
            var diagram = new type.UMLClassDiagram();
            diagram._parent = base;
            diagram.name = "Type Hierarchy";
            base.traverse(function (elem) {
                if (_isType(elem)) {
                    var relations = Repository.getRelationshipsOf(elem, function (rel) {
                        if ((rel instanceof type.UMLGeneralization) || (rel instanceof type.UMLInterfaceRealization)) {
                            if (_.contains(allTypes, rel.source) && _.contains(allTypes, rel.target)) {
                                return true;
                            }
                        }
                        return false;
                    });
                    if (relations.length > 0) {
                        var options = {
                                suppressAttributes: true,
                                suppressOperations: true,
                                suppressLiterals: true,
                                autoResize: true,
                                showNamespace: true
                            },
                            view = createViewOf(elem, options);
                        if (view) {
                            // add view
                            diagram.addOwnedView(view);
                            // add generalization views
                            var i, len, edgeViews = [];
                            edgeViews = edgeViews.concat(createEdgeViewsOf(diagram, view, type.UMLGeneralizationView));
                            edgeViews = edgeViews.concat(createEdgeViewsOf(diagram, view, type.UMLInterfaceRealizationView));
                            for (i = 0, len = edgeViews.length; i < len; i++) {
                                diagram.addOwnedView(edgeViews[i]);
                            }
                        }
                    }
                }
            });

            // Add Diagram
            diagram = _addDiagram(base, diagram);

            // Layout Diagram
            _layoutDiagram(diagram, Core.DIRECTION_LR, {node:10, edge:10, rank:100});

            // Open Diagram
            if (!doNotOpen) {
                DiagramManager.openDiagram(diagram);
                DiagramManager.repaint();
            }

        } else {
            Dialogs.showInfoDialog("To generate type hierarchy diagram, select a Package.");
        }
    }

    /**
     * Create Package Structure Diagram
     * @param {Element} base
     * @param {boolean} doNotOpen
     */
    function _handlePackageStructure(base, doNotOpen) {

        function _testParentView(v) {
            return (v.model === view.model._parent);
        }

        if (!base) {
            var selected = SelectionManager.getSelected();
            if (selected instanceof type.UMLPackage) {
                base = selected;
            }
        }
        if (base) {
            // Create Type Hierarchy Diagram
            var diagram = new type.UMLPackageDiagram();
            diagram._parent = base;
            diagram.name = "Package Structure";
            // 1. Add Package Views
            base.traverse(function (elem) {
                if (elem !== base && elem instanceof type.UMLPackage) {
                    var view = createViewOf(elem, {autoResize: true});
                    if (view) {
                        diagram.addOwnedView(view);
                    }
                }
            });
            // 2. Add Containment Views
            var i, len, view;
            for (i = 0, len = diagram.ownedViews.length; i < len; i++) {
                view = diagram.ownedViews[i];
                var parentView = _.find(diagram.ownedViews, _testParentView);
                if (parentView) {
                    var containmentView = new type.UMLContainmentView();
                    containmentView.tail = view;
                    containmentView.head = parentView;
                    containmentView.initialize(null, containmentView.tail.left, containmentView.tail.top, containmentView.head.left, containmentView.head.top);
                    diagram.addOwnedView(containmentView);
                }
            }

            // Add Diagram
            diagram = _addDiagram(base, diagram);

            // Layout Diagram
            _layoutDiagram(diagram);

            // Open Diagram
            if (!doNotOpen) {
                DiagramManager.openDiagram(diagram);
                DiagramManager.repaint();
            }

        } else {
            Dialogs.showInfoDialog("To generate package structure diagram, select a Package.");
        }
    }

    // Register Commands
    CommandManager.register("Diagram Generator",   CMD_DIAGRAM_GENERATOR,                   CommandManager.doNothing);
    CommandManager.register("Overview",            CMD_DIAGRAM_GENERATOR_OVERVIEW,          _handleOverviewSuppressed);
    CommandManager.register("Overview (Expanded)", CMD_DIAGRAM_GENERATOR_OVERVIEW_EXPANDED, _handleOverviewExpanded);
    CommandManager.register("Type Hierarchy",      CMD_DIAGRAM_GENERATOR_TYPE_HIERARCHY,    _handleTypeHierarchy);
    CommandManager.register("Package Structure",   CMD_DIAGRAM_GENERATOR_PACKAGE_STRUCTURE, _handlePackageStructure);

    // Setup Menus
    var menu = MenuManager.getMenu(Commands.TOOLS);
    var menuItem = menu.addMenuItem(CMD_DIAGRAM_GENERATOR);
    menuItem.addMenuItem(CMD_DIAGRAM_GENERATOR_OVERVIEW);
    menuItem.addMenuItem(CMD_DIAGRAM_GENERATOR_OVERVIEW_EXPANDED);
    menuItem.addMenuItem(CMD_DIAGRAM_GENERATOR_TYPE_HIERARCHY);
    menuItem.addMenuItem(CMD_DIAGRAM_GENERATOR_PACKAGE_STRUCTURE);

});


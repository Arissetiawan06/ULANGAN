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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, _, it, xit, expect, beforeEach, beforeFirst, afterEach, afterLast, spyOn, waitsFor, runs, $, type, app, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var Repository,       // loaded from app.test
        ProjectManager,   // loaded from app.test
        CommandManager,   // loaded from app.test
        Commands,         // loaded from app.test
        FileSystem,       // loaded from app.test
        Dialogs,          // loaded from app.test
        SpecRunnerUtils = app.getModule("spec/SpecRunnerUtils"),
        FileUtils       = app.getModule("file/FileUtils"),
        ExtensionUtils  = app.getModule("utils/ExtensionUtils");

    describe("Diagram Export", function () {
        var testPath = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files",
            testWindow;

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from app.test
                window.type         = testWindow.type;
                Repository          = testWindow.app.test.Repository;
                ProjectManager      = testWindow.app.test.ProjectManager;
                CommandManager      = testWindow.app.test.CommandManager;
                Commands            = testWindow.app.test.Commands;
                FileSystem          = testWindow.app.test.FileSystem;
                Dialogs             = testWindow.app.test.Dialogs;
            });
        });

        afterLast(function () {
            testWindow          = null;
            Repository          = null;
            ProjectManager      = null;
            CommandManager      = null;
            Commands            = null;
            FileSystem          = null;
            Dialogs             = null;
            SpecRunnerUtils.closeTestWindow();
        });

        beforeEach(function () {

        });

        afterEach(function () {
            runs(function () {
                testWindow.app.test.ProjectManager.closeProject();
            });
        });

        /** Expect a file to exist (failing test if not) and then delete it */
        function expectAndDelete(fullPath) {
            runs(function () {
                var promise = SpecRunnerUtils.resolveNativeFileSystemPath(fullPath);
                waitsForDone(promise, "Verify file exists: " + fullPath);
            });
            runs(function () {
                var promise = SpecRunnerUtils.deletePath(fullPath);
                waitsForDone(promise, "Remove testfile " + fullPath, 5000);
            });
        }

        it("can export to PNG", function () {
            var filePath,
                newFilePath,
                diagram;

            runs(function () {
                // Select a file in Open Dialog
                filePath = testPath + "/DiagramExportTest.mdj";
                spyOn(FileSystem, 'showOpenDialog').andCallFake(function (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
                    callback(undefined, [filePath]);
                });

                var promise = CommandManager.execute(Commands.FILE_OPEN);
                waitsForDone(promise);
            });

            runs(function () {
                diagram = Repository.find(function (e) {
                    return (e instanceof testWindow.type.UMLClassDiagram) && (e.name === "Main");
                });
                expect(ProjectManager.getProject()).not.toBe(null);
                expect(ProjectManager.getFilename()).toEqual(filePath);
                expect(diagram).not.toBe(null);
            });

            runs(function () {
                // Save to File
                newFilePath = testPath + "/PNG_EXPORT_TEST.png";
                spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                    callback(undefined, newFilePath);
                });

                var promise = CommandManager.execute("file.exportDiagramAs.png");
                waitsForDone(promise);
            });

            runs(function () {
                expectAndDelete(newFilePath);
            });
        });

        it("can export to JPEG", function () {
            var filePath,
                newFilePath,
                diagram;

            runs(function () {
                // Select a file in Open Dialog
                filePath = testPath + "/DiagramExportTest.mdj";
                spyOn(FileSystem, 'showOpenDialog').andCallFake(function (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
                    callback(undefined, [filePath]);
                });

                var promise = CommandManager.execute(Commands.FILE_OPEN);
                waitsForDone(promise);
            });

            runs(function () {
                diagram = Repository.find(function (e) {
                    return (e instanceof testWindow.type.UMLClassDiagram) && (e.name === "Main");
                });
                expect(ProjectManager.getProject()).not.toBe(null);
                expect(ProjectManager.getFilename()).toEqual(filePath);
                expect(diagram).not.toBe(null);
            });

            runs(function () {
                // Save to File
                newFilePath = testPath + "/JPEG_EXPORT_TEST.jpeg";
                spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                    callback(undefined, newFilePath);
                });

                var promise = CommandManager.execute("file.exportDiagramAs.jpeg");
                waitsForDone(promise);
            });

            runs(function () {
                expectAndDelete(newFilePath);
            });
        });

        it("can export to SVG", function () {
            var filePath,
                newFilePath,
                diagram;

            runs(function () {
                // Select a file in Open Dialog
                filePath = testPath + "/DiagramExportTest.mdj";
                spyOn(FileSystem, 'showOpenDialog').andCallFake(function (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
                    callback(undefined, [filePath]);
                });

                var promise = CommandManager.execute(Commands.FILE_OPEN);
                waitsForDone(promise);
            });

            runs(function () {
                diagram = Repository.find(function (e) {
                    return (e instanceof testWindow.type.UMLClassDiagram) && (e.name === "Main");
                });
                expect(ProjectManager.getProject()).not.toBe(null);
                expect(ProjectManager.getFilename()).toEqual(filePath);
                expect(diagram).not.toBe(null);
            });

            runs(function () {
                // Save to File
                newFilePath = testPath + "/SVG_EXPORT_TEST.svg";
                spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                    callback(undefined, newFilePath);
                });

                var promise = CommandManager.execute("file.exportDiagramAs.svg");
                waitsForDone(promise);
            });

            runs(function () {
                expectAndDelete(newFilePath);
            });
        });

    });

});

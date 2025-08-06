#target photoshop

function main() {
    if (!documents.length) {
        alert("Please open at least one target PSD file.");
        return;
    }

    else{
        var psdDoc = app.activeDocument;
        var photoFiles = [];

        var openedDocs = [];
        for (var i = 0; i < app.documents.length; i++) {
            if (app.documents[i] !== psdDoc) {
                openedDocs.push(app.documents[i]);
            }
        }

        var usingBrowse = false;

        // ✅ If only PSD open, let user pick photo files
        if (openedDocs.length === 0) {
            photoFiles = File.openDialog("Select one or more photos", "*.jpg;*.png;*.jpeg", true);
            if (!photoFiles || photoFiles.length === 0) {
                alert("No photos selected.");
                return;
            }
            usingBrowse = true;
        }

        // ✅ Always rename smart object layers before placing
        autoRenameSmartLayers(psdDoc);

        var landscapeIndex = 1;
        var portraitIndex = 1;

        // ✅ If using file browser
        if (usingBrowse) {
            for (var i = 0; i < photoFiles.length; i++) {
                var photoDoc = open(photoFiles[i]);
                processPhoto(photoDoc, true);
            }
        } else {
            // ✅ If photos are already opened
            for (var i = 0; i < openedDocs.length; i++) {
                processPhoto(openedDocs[i], true);
            }
        }

        alert("✅ All photos processed.");

        function processPhoto(photoDoc, shouldCloseAfter) {
            var isLandscape = photoDoc.width > photoDoc.height;
            var layerName = isLandscape ? "ammu_landscape_" + landscapeIndex : "ammu_portrait_" + portraitIndex;

            try {
                app.activeDocument = psdDoc;

                var smartLayer = findLayerAnywhere(psdDoc, layerName);
                if (!smartLayer) {
                    return; // ❌ No alert, no close — skip silently
                }

                psdDoc.activeLayer = smartLayer;

                // Target bounds
                var bounds = smartLayer.bounds;
                var targetWidth = bounds[2] - bounds[0];
                var targetHeight = bounds[3] - bounds[1];
                var targetCenterX = bounds[0] + (targetWidth / 2);
                var targetCenterY = bounds[1] + (targetHeight / 2);

                // Copy photo
                app.activeDocument = photoDoc;
                photoDoc.selection.selectAll();
                photoDoc.selection.copy();

                // Paste into PSD
                app.activeDocument = psdDoc;
                var pastedLayer = psdDoc.paste();
                pastedLayer.name = "Pasted_" + layerName;

                // Convert to Smart Object
                pastedLayer = convertToSmartObject(pastedLayer);

                // Move before smart layer
                pastedLayer.move(smartLayer, ElementPlacement.PLACEBEFORE);

                // Resize & center
                var layerW = pastedLayer.bounds[2] - pastedLayer.bounds[0];
                var layerH = pastedLayer.bounds[3] - pastedLayer.bounds[1];
                var scale = Math.max(targetWidth / layerW, targetHeight / layerH);
                pastedLayer.resize(scale * 100, scale * 100, AnchorPosition.MIDDLECENTER);

                var pastedBounds = pastedLayer.bounds;
                var pastedCenterX = (pastedBounds[0] + pastedBounds[2]) / 2;
                var pastedCenterY = (pastedBounds[1] + pastedBounds[3]) / 2;
                pastedLayer.translate(targetCenterX - pastedCenterX, targetCenterY - pastedCenterY);

                // Apply clipping mask
                pastedLayer.grouped = true;

                // Increment index
                if (isLandscape) landscapeIndex++;
                else portraitIndex++;

                // ✅ Close file if it was opened by browse
                if (shouldCloseAfter) {
                    app.activeDocument = photoDoc;
                    photoDoc.close(SaveOptions.DONOTSAVECHANGES);
                }

            } catch (e) {
                // skip silently
            }
        }
    }

   
}














// 🔁 Rename all smart object layers based on orientation
function autoRenameSmartLayers(psdDoc) {
    app.activeDocument = psdDoc;

    // First, count how many smart object layers are there by type
    var landscapeCount = 0;
    var portraitCount = 0;

    // 🔁 Recursive layer count
    function countSmartLayers(layer) {
        if (layer.typename === "ArtLayer" && layer.kind === LayerKind.SMARTOBJECT) {
            var w = layer.bounds[2] - layer.bounds[0];
            var h = layer.bounds[3] - layer.bounds[1];
            if (w > h) {
                landscapeCount++;
            } else {
                portraitCount++;
            }
        } else if (layer.typename === "LayerSet") {
            for (var i = 0; i < layer.layers.length; i++) {
                countSmartLayers(layer.layers[i]);
            }
        }
    }

    // Step 1: Count all
    for (var i = 0; i < psdDoc.layers.length; i++) {
        countSmartLayers(psdDoc.layers[i]);
    }

    // Step 2: Rename using reverse numbers
    function renameSmartLayers(layer) {
        if (layer.typename === "ArtLayer" && layer.kind === LayerKind.SMARTOBJECT) {
            var w = layer.bounds[2] - layer.bounds[0];
            var h = layer.bounds[3] - layer.bounds[1];
            if (w > h && landscapeCount > 0) {
                layer.name = "ammu_landscape_" + landscapeCount;
                landscapeCount--;
            } else if (w <= h && portraitCount > 0) {
                layer.name = "ammu_portrait_" + portraitCount;
                portraitCount--;
            }
        } else if (layer.typename === "LayerSet") {
            for (var i = 0; i < layer.layers.length; i++) {
                renameSmartLayers(layer.layers[i]);
            }
        }
    }

    for (var i = 0; i < psdDoc.layers.length; i++) {
        renameSmartLayers(psdDoc.layers[i]);
    }
}







// 🔍 Find a layer by name, even inside groups
function findLayerAnywhere(parent, name) {
    for (var i = 0; i < parent.layers.length; i++) {
        var layer = parent.layers[i];
        if (layer.typename === "ArtLayer" && layer.name === name) {
            return layer;
        } else if (layer.typename === "LayerSet") {
            var found = findLayerAnywhere(layer, name);
            if (found) return found;
        }
    }
    return null;
}





// 🔁 Convert to smart object
function convertToSmartObject(layer) {
    app.activeDocument.activeLayer = layer;
    var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer");
    executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
    return app.activeDocument.activeLayer;
}





// 🚀 Start script
main();

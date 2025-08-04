#target photoshop

// ⭐ MAIN FUNCTION ⭐
function main() {
    // ✅ 1. Check if PSD is opened
    if (!documents.length) {
        alert("Please open at least one target PSD file.");
        return;
    }

    var psdDoc = app.activeDocument;

    // ✅ 2. Get all other photo documents (excluding the PSD)
    var photoDocs = [];
    for (var i = 0; i < app.documents.length; i++) {
        var doc = app.documents[i];
        if (doc !== psdDoc) {
            photoDocs.push(doc);
        }
    }

    // ✅ If no photo documents are opened, ask user to select files manually
    if (photoDocs.length === 0) {
        var photoFiles = File.openDialog("📂 Select one or more photo files to place", "Images: *.jpg; *.jpeg; *.png; *.psd", true);
        if (photoFiles === null || photoFiles.length === 0) {
            alert("❌ No photo files selected.");
            return;
        }

        for (var i = 0; i < photoFiles.length; i++) {
            var openedDoc = app.open(photoFiles[i]);
            photoDocs.push(openedDoc);
        }
    }

    // ✅ 3. Rename all smart object layers based on orientation
    autoRenameSmartLayers(psdDoc);

    var landscapeIndex = 1;
    var portraitIndex = 1;

    // ✅ 4. Loop through all photo documents
    for (var i = 0; i < photoDocs.length; i++) {
        var photoDoc = photoDocs[i];
        var isLandscape = photoDoc.width > photoDoc.height;

        // 📌 Build smart layer name to search (ammu_landscape_1, etc.)
        var layerName = isLandscape ? "ammu_landscape_" + landscapeIndex : "ammu_portrait_" + portraitIndex;

        try {
            // 🔍 Find smart object layer with the given name
            var smartLayer = findLayerAnywhere(psdDoc, layerName);
            if (!smartLayer) {
                alert("❗ Smart object layer '" + layerName + "' not found. Skipping this photo.");
                continue;
            }

            app.activeDocument = psdDoc;
            psdDoc.activeLayer = smartLayer;

            // ✅ Get smart layer bounds (x1, y1, x2, y2)
            var bounds = smartLayer.bounds;
            var targetWidth = bounds[2] - bounds[0];
            var targetHeight = bounds[3] - bounds[1];
            var targetCenterX = bounds[0] + (targetWidth / 2);
            var targetCenterY = bounds[1] + (targetHeight / 2);

            // 📋 Copy photo
            app.activeDocument = photoDoc;
            photoDoc.selection.selectAll();
            photoDoc.selection.copy();

            // 📥 Paste into PSD
            app.activeDocument = psdDoc;
            var pastedLayer = psdDoc.paste();
            pastedLayer.name = "Pasted_" + layerName;

            // 🔁 Convert to Smart Object before resizing
            pastedLayer = convertToSmartObject(pastedLayer);

            // 🔽 Move pasted below the smart layer
            pastedLayer.move(smartLayer, ElementPlacement.PLACEBEFORE);

            // 📏 Resize photo to match smart object size
            var layerW = pastedLayer.bounds[2] - pastedLayer.bounds[0];
            var layerH = pastedLayer.bounds[3] - pastedLayer.bounds[1];
            var scale = Math.max(
                targetWidth / layerW,
                targetHeight / layerH
            );
            pastedLayer.resize(scale * 100, scale * 100, AnchorPosition.MIDDLECENTER);

            // 🎯 Center align the pasted photo
            var pastedBounds = pastedLayer.bounds;
            var pastedCenterX = (pastedBounds[0] + pastedBounds[2]) / 2;
            var pastedCenterY = (pastedBounds[1] + pastedBounds[3]) / 2;
            pastedLayer.translate(targetCenterX - pastedCenterX, targetCenterY - pastedCenterY);

            // 🔗 Apply Clipping Mask
            pastedLayer.grouped = true;

            // ❌ Close the photo document without saving
            app.activeDocument = photoDoc;
            photoDoc.close(SaveOptions.DONOTSAVECHANGES);

            // 🔁 Update index
            if (isLandscape) landscapeIndex++;
            else portraitIndex++;

        } catch (e) {
            alert("❌ Error placing photo into '" + layerName + "':\n" + e.message);
        }
    }

    alert("✅ All photos placed, clipped, and photo files closed.");
}

// 🔁 Auto rename smart object layers based on orientation (ammu_ format)
function autoRenameSmartLayers(psdDoc) {
    app.activeDocument = psdDoc; // ✅ Fix for Error 8100

    var landscapeIndex = 1;
    var portraitIndex = 1;

    for (var i = 0; i < psdDoc.layers.length; i++) {
        renameSmartLayersRecursive(psdDoc.layers[i]);
    }

    function renameSmartLayersRecursive(layer) {
        if (layer.typename === "ArtLayer" && layer.kind === LayerKind.SMARTOBJECT) {
            var w = layer.bounds[2] - layer.bounds[0];
            var h = layer.bounds[3] - layer.bounds[1];
            if (w > h) {
                layer.name = "ammu_landscape_" + landscapeIndex++;
            } else {
                layer.name = "ammu_portrait_" + portraitIndex++;
            }
        } else if (layer.typename === "LayerSet") {
            for (var j = 0; j < layer.layers.length; j++) {
                renameSmartLayersRecursive(layer.layers[j]);
            }
        }
    }
}

// 🔍 Recursive function to find layer by name inside any group
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

// 🔧 Convert a layer to Smart Object
function convertToSmartObject(layer) {
    app.activeDocument.activeLayer = layer;
    var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer");
    executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
    return app.activeDocument.activeLayer;
}

// 🚀 Run the main process
main();

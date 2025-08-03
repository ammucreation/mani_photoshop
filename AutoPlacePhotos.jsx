#target photoshop

function main() {
    if (!documents.length) {
        alert("Please open at least one target PSD file.");
        return;
    }

    var psdDoc = app.activeDocument;

    var photoDocs = [];
    for (var i = 0; i < app.documents.length; i++) {
        var doc = app.documents[i];
        if (doc !== psdDoc) {
            photoDocs.push(doc);
        }
    }

    if (photoDocs.length === 0) {
        alert("Please open at least one photo document (apart from the PSD).");
        return;
    }

    var landscapeIndex = 1;
    var portraitIndex = 1;

    for (var i = 0; i < photoDocs.length; i++) {
        var photoDoc = photoDocs[i];
        var isLandscape = photoDoc.width > photoDoc.height;
        var layerName = isLandscape ? "Photo_landscape_" + landscapeIndex : "Photo_portrait_" + portraitIndex;

        try {
            var smartLayer = findLayerAnywhere(psdDoc, layerName);
            if (!smartLayer) {
                alert("Smart object layer '" + layerName + "' not found.");
                continue;
            }

            psdDoc.activeLayer = smartLayer;

            // Get smart layer bounds
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

            // Move pasted below the smart layer
            pastedLayer.move(smartLayer, ElementPlacement.PLACEBEFORE);

            // Resize to fit
            var layerW = pastedLayer.bounds[2] - pastedLayer.bounds[0];
            var layerH = pastedLayer.bounds[3] - pastedLayer.bounds[1];
            var scale = Math.max(
                targetWidth / layerW,
                targetHeight / layerH
            );
            pastedLayer.resize(scale * 100, scale * 100, AnchorPosition.MIDDLECENTER);

            // Align center
            var pastedBounds = pastedLayer.bounds;
            var pastedCenterX = (pastedBounds[0] + pastedBounds[2]) / 2;
            var pastedCenterY = (pastedBounds[1] + pastedBounds[3]) / 2;
            pastedLayer.translate(targetCenterX - pastedCenterX, targetCenterY - pastedCenterY);

            // Clipping mask
            pastedLayer.grouped = true;

            // Auto-close photo document
            app.activeDocument = photoDoc;
            photoDoc.close(SaveOptions.DONOTSAVECHANGES);

            // Update index
            if (isLandscape) landscapeIndex++;
            else portraitIndex++;

        } catch (e) {
            alert("Error placing photo into '" + layerName + "':\n" + e.message);
        }
    }

    alert("✅ All photos placed, clipped, and photo files closed.");
}

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

main();

#target photoshop

function moveAndRenamePhotos() {
    // Step 1: Folder select
    var inputFolder = Folder.selectDialog("📁 Photos irukkura folder select pannunga");
    if (!inputFolder) {
        alert("❌ Folder select pannala. Script stop aayiduchu.");
        return;
    }

    // Step 2: Create output folders
    var verticalFolder = new Folder(inputFolder.fsName + "/Vertical");
    if (!verticalFolder.exists) verticalFolder.create();

    var horizontalFolder = new Folder(inputFolder.fsName + "/Horizontal");
    if (!horizontalFolder.exists) horizontalFolder.create();

    // Step 3: Filter image files
    var files = inputFolder.getFiles(function(file) {
        return (file instanceof File) && (/\.(jpg|jpeg|png|tif|tiff|bmp)$/i).test(file.name);
    });

    if (files.length === 0) {
        alert("❌ No image files found in this folder.");
        return;
    }

    // Step 4: Start timer
    var startTime = new Date();
    var verticalCount = 1;
    var horizontalCount = 1;
    var moved = 0;
    var skipped = 0;

    // Step 5: Loop files
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        try {
            var doc = open(file);
            var width = doc.width.as("px");
            var height = doc.height.as("px");
            doc.close(SaveOptions.DONOTSAVECHANGES);

            var isVertical = (width < height);
            var destinationFolder = isVertical ? verticalFolder : horizontalFolder;
            var count = isVertical ? verticalCount : horizontalCount;
            var extension = file.name.split('.').pop();
            var newName = (isVertical ? "Vertical_" : "Horizontal_") + count + "." + extension;
            var newPath = new File(destinationFolder.fsName + "/" + newName);

            // Skip if file already exists
            if (newPath.exists) {
                $.writeln("⏩ Skipping (already exists): " + newName);
                skipped++;
                continue;
            }

            // Copy + delete original
            file.copy(newPath);
            file.remove();
            moved++;

            // Count increment
            if (isVertical) {
                verticalCount++;
            } else {
                horizontalCount++;
            }

            // Progress
            $.writeln("✅ Moved: " + file.name + " ➜ " + newName);

        } catch (e) {
            alert("⚠️ Error with file: " + file.name + "\n" + e.message);
        }
    }

    // Step 6: End timer
    var endTime = new Date();
    var timeTaken = (endTime - startTime) / 1000;

    // Step 7: Final alert
    alert("✅ Process Completed!\n📸 Total Files: " + files.length +
          "\n✅ Moved: " + moved +
          "\n⏩ Skipped (already exists): " + skipped +
          "\n🕒 Time: " + Math.round(timeTaken) + " sec (" + Math.round(timeTaken / 60) + " min)");
}

moveAndRenamePhotos();

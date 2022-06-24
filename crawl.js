var fs = require("fs");
var https = require("https");
var host = process.argv[2] || "https://www.lua.org/pil/";
var file = process.argv[3] || "contents.html";
var targetDir = process.argv[3] || "./output";
console.log({ host: host, file: file, targetDir: targetDir });
var outFile = "./".concat(targetDir, "/").concat(file);
fs.stat(targetDir, function (err, stats) {
    if (stats.isDirectory()) {
        fs.rmdirSync(targetDir, { recursive: true });
    }
    fs.mkdirSync(targetDir);
});
var options = {};
var initalURL = "".concat(host).concat(file);
var downloadAndSave = function (url) {
    https.get(url, function (res) {
        var data = [];
        res.on("data", function (chunk) {
            data.push(chunk);
        });
        res.on("end", function () {
            var str = Buffer.concat(data).toString();
            var outFile = "".concat(targetDir, "/").concat(file);
            fs.writeFile(outFile, str, function (err) {
                if (err) {
                    throw err;
                }
                console.log("saved: ", outFile);
            });
        });
    });
};
downloadAndSave(initalURL);

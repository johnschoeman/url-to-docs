const fs = require("fs")
const https = require("https")

const host = process.argv[2] || "https://www.lua.org/pil/"
const file = process.argv[3] || "contents.html"
const targetDir = process.argv[3] || "./output"

console.log({ host, file, targetDir })

const outFile = `./${targetDir}/${file}`

fs.stat(targetDir, (err, stats) => {
  if (stats.isDirectory()) {
    fs.rmdirSync(targetDir, { recursive: true })
  }
  fs.mkdirSync(targetDir)
})

const options = {}

const initalURL = `${host}${file}`

const downloadAndSave = (url: string): void => {
  https.get(url, res => {
    let data = []

    res.on("data", chunk => {
      data.push(chunk)
    })

    res.on("end", () => {
      const str = Buffer.concat(data).toString()
      const outFile = `${targetDir}/${file}`
      fs.writeFile(outFile, str, err => {
        if (err) {
          throw err
        }
        console.log("saved: ", outFile)
      })
    })
  })
}

downloadAndSave(initalURL)

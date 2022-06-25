import fs from "fs"
import https from "https"

const host = process.argv[2] || "https://www.lua.org/pil/"
const file = process.argv[3] || "contents.html"
const targetDir = process.argv[3] || "./output"

console.log({ host, file, targetDir })

fs.stat(targetDir, (_err, stats) => {
  if (stats.isDirectory()) {
    fs.rmdirSync(targetDir, { recursive: true })
  }
  fs.mkdirSync(targetDir)
})

const initalURL = `${host}${file}`

const downloadAndSave = (url: string): void => {
  https.get(url, res => {
    let data: any[] = []

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

export {}

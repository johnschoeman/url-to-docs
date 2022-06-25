import fs from "fs"
import https from "https"

const logPrefix = "[CrawlForDocs]"
const log = console.log.bind(console, logPrefix)

const url = process.argv[2]|| "https://www.lua.org/pil/contents.html"
const targetDir = process.argv[3] || "./output"
const initialDepth = Number(process.argv[4]) || 4


const splitHostAndFile = (url: string): [string, string] => {
  const index = url.lastIndexOf('/');
  const host = url.slice(0, index + 1);
  const file = url.slice(index + 1);
  return [host, file]
}

const [host, file] = splitHostAndFile(url)

log("Crawling:", url)
log("Saving to:", targetDir)

const crawlUrl = async (
  host: string,
  file: string,
  depth: number = 4,
): Promise<void> => {
  if (depth === 0) return

  const url = `${host}${file}`

  https.get(url, res => {
    let data: any[] = []

    res.on("data", chunk => {
      data.push(chunk)
    })

    res.on("end", async () => {
      const str = Buffer.concat(data).toString()
      const outfile = `${targetDir}/${file}`
      try {
        fs.writeFileSync(outfile, str)

        const successMsg = `wrote: ${outfile}`
        log(successMsg)

        const allLinks = findLinksFrom(str)
        const newFiles = allLinks.filter((link) => {
          const path = `${targetDir}/${link}`
          return !isFile(path)
        })

        for await (const file of newFiles) {
          await crawlUrl(host, file, depth - 1)
        }
      } catch (err) {
        throw err
      }
    })
  })
}

const isFile = (path: string): boolean => {
  try {
    const result = fs.statSync(path)
    return result.isFile()
  } catch {
    return false
  }
}

const findLinksFrom = (str: string): string[] => {
  const anchorRegEx = new RegExp(/<a[^>]*?href=(["\'])?((?:.(?!\1|>))*.?)\1?/gi)
  const anchorTags = str.matchAll(anchorRegEx)
  const allHrefs = Array.from(anchorTags).map(matchGroup => matchGroup[2])
  const relativeHrefs = allHrefs
    .filter(isRelativeHref)
    .map(withoutUrlParams)
    .filter(isUnique)
  return relativeHrefs
}

const isUnique = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index
}

type RelativeHref = string
const isRelativeHref = (str: string | undefined): str is RelativeHref => {
  if (str === undefined) {
    return false
  }
  const relativeHrefRegEx = new RegExp(/^(?!(http)|(\.\.\/)).*\.html(#.*)*$/gi)
  const result = str.match(relativeHrefRegEx)
  return !!result
}

const withoutUrlParams = (str: string): string => {
  return str.replace(/#.*$/, "")
}

const resetDir = (dir: string) => {
  fs.stat(dir, (_err, stats) => {
    if (stats.isDirectory()) {
      fs.rmSync(dir, { recursive: true })
    }
    fs.mkdirSync(dir)
  })
}

resetDir(targetDir)
crawlUrl(host, file, initialDepth)

export {}

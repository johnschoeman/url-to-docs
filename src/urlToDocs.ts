import fs from "fs"
import https from "https"

export const urlToDocs = async (
  url: string,
  depth: number,
  outputDir: string,
): Promise<void> => {
  const [host, file] = splitHostAndFile(url)

  await crawlUrl(https.request, host, [file], outputDir, depth)
}

export const splitHostAndFile = (url: string): [string, string] => {
  const index = url.lastIndexOf("/")
  const host = url.slice(0, index + 1)
  const file = url.slice(index + 1)
  return [host, file]
}

export const crawlUrl = async (
  request: typeof https.request,
  host: string,
  files: string[],
  outputDir: string,
  depth: number = 4,
): Promise<void> => {
  if (depth === 0) return

  let nextLinks: string[] = []
  for await (let f of files) {
    const n = await downloadFileAndReturnLinks(request, host, f, outputDir)
    nextLinks = Array.from(new Set(nextLinks.concat(n)))
  }

  const newFiles = nextLinks.filter(link => {
    const path = `${outputDir}/${link}`
    return !isFile(path)
  })

  await crawlUrl(request, host, newFiles, outputDir, depth - 1)
}

const downloadFileAndReturnLinks = (
  request: typeof https.request,
  host: string,
  file: string,
  outputDir: string,
): Promise<string[]> => {
  const url = `${host}${file}`

  return new Promise((resolve, reject) => {
    const clientRequest = request(url, incomingMessage => {
      let response = {
        statusCode: incomingMessage.statusCode,
        headers: incomingMessage.headers,
        body: [] as any[],
      }

      incomingMessage.on("data", chunk => {
        response.body.push(chunk)
      })
      let foundLinks: string[] = []

      incomingMessage.on("end", () => {
        const str = Buffer.concat(response.body).toString()
        const outfile = `${outputDir}/${file}`
        try {
          fs.writeFileSync(outfile, str)
          console.log(`wrote: ${outfile}`)
          foundLinks = findLinksFrom(str)
        } catch (err) {
          throw err
        }

        resolve(foundLinks)
      })
    })

    clientRequest.on("error", error => {
      reject(error)
    })

    clientRequest.end()
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
  return Boolean(result)
}

const withoutUrlParams = (str: string): string => {
  return str.replace(/#.*$/, "")
}

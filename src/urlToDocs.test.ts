import https from "https"
import fs from "fs"

import { crawlUrl, splitHostAndFile } from "./urlToDocs"

describe("crawlUrl", () => {
  it("only downloads a file present in link the graph once", async () => {
    const testOutputDir = "test_output"
    fs.mkdirSync(testOutputDir)

    const host = "https://foo.com"
    const file = "file0.html"
    const depth = 3
    const result: string[] = []

    await crawlUrl(
      mockRequest(result) as unknown as typeof https.request,
      host,
      [file],
      testOutputDir,
      depth,
    )

    const expected = [
      "file0.html",
      "file1.html",
      "file2.html",
      "file3.html",
      "file4.html",
      "file5.html",
      "file6.html",
      "file7.html",
      "file8.html",
    ]
    expect(result).toEqual(expected)

    fs.rmdirSync(testOutputDir, { recursive: true })
  })
})

const mockRequest =
  (filesRequested: string[]) => (url: string, cb: (res: any) => void) => {
    const [_host, file] = splitHostAndFile(url)
    filesRequested.push(file)

    const html = getHtml(file)
    cb(res(html))

    return {
      on: () => {},
      end: () => {},
    }
  }

const res = (responsData: Buffer) => {
  return {
    on: async (event: "data" | "end", cb: any) => {
      switch (event) {
        case "data":
          cb(responsData)
          break
        case "end":
          cb()
          break
      }
    },
  }
}

const file0Html = fs.readFileSync("src/fixtures/file0.html")
const file1Html = fs.readFileSync("src/fixtures/file1.html")
const file2Html = fs.readFileSync("src/fixtures/file2.html")
const file3Html = fs.readFileSync("src/fixtures/file3.html")
const file4Html = fs.readFileSync("src/fixtures/file4.html")
const file5Html = fs.readFileSync("src/fixtures/file5.html")
const file6Html = fs.readFileSync("src/fixtures/file6.html")
const file7Html = fs.readFileSync("src/fixtures/file7.html")
const file8Html = fs.readFileSync("src/fixtures/file8.html")
const getHtml = (file: string) => {
  switch (file) {
    case "file0.html":
      return file0Html
    case "file1.html":
      return file1Html
    case "file2.html":
      return file2Html
    case "file3.html":
      return file3Html
    case "file4.html":
      return file4Html
    case "file5.html":
      return file5Html
    case "file6.html":
      return file6Html
    case "file7.html":
      return file7Html
    case "file8.html":
      return file8Html
    default:
      return file0Html
  }
}

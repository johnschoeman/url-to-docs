#!/usr/bin/env node

import arg from "arg"
import path from "path"
import fs from "fs"

import packageJson from "../package.json"
import { urlToDocs } from "./urlToDocs"

const DEFAULT_OUTPUT_DIR = "url_to_docs_output"
const DEFAULT_CRAWL_DEPTH = 3

// ---- Setup CLI ----

function help({ message, usage, commands, options }) {
  let indent = 2

  // Render header
  console.log()
  console.log(`${packageJson.name} v${packageJson.version}`)

  // Render message
  if (message) {
    console.log()
    for (let msg of message.split("\n")) {
      console.log(msg)
    }
  }

  // Render usage
  if (usage && usage.length > 0) {
    console.log()
    console.log("Usage:")
    for (let example of usage) {
      console.log(" ".repeat(indent), example)
    }
  }

  // Render commands
  if (commands && commands.length > 0) {
    console.log()
    console.log("Commands:")
    for (let command of commands) {
      console.log(" ".repeat(indent), command)
    }
  }

  // Render options
  if (options) {
    let groupedOptions = {}
    for (let [key, value] of Object.entries(options)) {
      if (typeof value === "object") {
        groupedOptions[key] = { ...value, flags: [key] }
      } else {
        groupedOptions[value].flags.push(key)
      }
    }

    console.log()
    console.log("Options:")
    for (let { flags, description, deprecated } of Object.values(
      groupedOptions,
    )) {
      if (deprecated) continue

      if (flags.length === 1) {
        console.log(
          " ".repeat(indent + 4 /* 4 = "-i, ".length */),
          flags.slice().reverse().join(", ").padEnd(20, " "),
          description,
        )
      } else {
        console.log(
          " ".repeat(indent),
          flags.slice().reverse().join(", ").padEnd(24, " "),
          description,
        )
      }
    }
  }

  console.log()
}

let commands = {
  build: {
    run: build,
    args: {
      "--url": { type: String, description: "Url to crawl and download" },
      "--depth": { type: String, description: "Depth of links to follow" },
      "--output": { type: String, description: "Directory to save files to" },
      "--force": {
        type: Boolean,
        description: "Replace output directory if present",
      },
      "-u": "--url",
      "-d": "--depth",
      "-o": "--output",
      "-f": "--force",
    },
  },
}

const sharedFlags = {
  "--help": { type: Boolean, description: "Display usage information" },
  "-h": "--help",
}

if (
  process.stdout.isTTY /* Detect redirecting output to a file */ &&
  (process.argv[2] === undefined ||
    process.argv.slice(2).every(flag => sharedFlags[flag] !== undefined))
) {
  help({
    usage: ["urltodocs --url https://example-docs.com --output docs"],
    options: { ...commands.build.args, ...sharedFlags },
  })
  process.exit(0)
}

// ---- Execute Command ----

const command = "build"

const { args: flags, run } = commands[command]

const buildArgs = () => {
  try {
    const result = arg(
      Object.fromEntries(
        Object.entries({ ...flags, ...sharedFlags })
          .filter(([_key, value]) => !value?.type?.manualParsing)
          .map(([key, value]) => [
            key,
            typeof value === "object" ? value.type : value,
          ]),
      ),
      { permissive: true },
    )
    return result
  } catch (err) {
    if (err.code === "ARG_UNKNOWN_OPTION") {
      help({
        message: err.message,
        usage: ["urltodocs --url https://example-docs.com --depth 3"],
        options: sharedFlags,
      })
      process.exit(1)
    }
    throw err
  }
}

const args = buildArgs()

run()

// ---- Define Commands ----

async function build() {
  const url = args["--url"]
  const output = args["--output"] ?? DEFAULT_OUTPUT_DIR
  const depth = Number(args["--depth"] ?? DEFAULT_CRAWL_DEPTH)
  const force = Boolean(args["--force"]) ?? false

  if (!url) {
    console.log("Error: specify a url with --url")
    return
  }

  if (!output) {
    console.log("Error: specify an output directory with --output")
    return
  }

  const outputDir = path.resolve(output)
  const dirExists = fs.existsSync(outputDir)
  if (dirExists) {
    if (force) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    } else {
      console.log(
        "Error: trying to write to existing directory. pass the --force flag if you wish to overwrite.",
      )
      return
    }
  }

  fs.mkdir(outputDir, error => {
    if (error) {
      console.error(error)
    }
  })

  console.log("Converting url to docs...")
  await urlToDocs(url, depth, outputDir)
  console.log("Done")
}

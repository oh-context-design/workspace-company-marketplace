#!/usr/bin/env swift
import Foundation

struct ValidatorFailure: Error, CustomStringConvertible {
    let description: String
}

struct Arguments {
    var repoRoot = "."
    var baseRef = ""
    var emitJSON = false
}

struct VersionValue {
    let raw: String?
}

func usage() -> String {
    """
    Usage:
        swift validate-versions.swift [--repo-root PATH] [--base-ref REF] [--json]
    """
}

func parseArguments(_ raw: [String]) throws -> Arguments {
    var args = Arguments()
    var index = 1

    while index < raw.count {
        let arg = raw[index]
        switch arg {
        case "--repo-root":
            guard index + 1 < raw.count else {
                throw ValidatorFailure(description: "argument --repo-root requires a value")
            }
            args.repoRoot = raw[index + 1]
            index += 2
        case "--base-ref":
            guard index + 1 < raw.count else {
                throw ValidatorFailure(description: "argument --base-ref requires a value")
            }
            args.baseRef = raw[index + 1]
            index += 2
        case "--json":
            args.emitJSON = true
            index += 1
        case "-h", "--help":
            print(usage())
            Foundation.exit(0)
        default:
            throw ValidatorFailure(description: "unknown argument: \(arg)")
        }
    }

    return args
}

func loadJSONObject(_ path: URL) throws -> [String: Any] {
    let data = try Data(contentsOf: path)
    guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        throw ValidatorFailure(description: "\(path.path) is not a JSON object")
    }
    return object
}

func stringValue(_ value: Any?) -> String? {
    value as? String
}

func repr(_ value: String?) -> String {
    guard let value else { return "None" }
    return "'\(value)'"
}

func marketplaceVersions(root: URL) throws -> [String: VersionValue] {
    let manifest = try loadJSONObject(root.appendingPathComponent(".claude-plugin/marketplace.json"))
    let entries = manifest["plugins"] as? [[String: Any]] ?? []
    var versions: [String: VersionValue] = [:]

    for entry in entries {
        if let name = stringValue(entry["name"]) {
            versions[name] = VersionValue(raw: stringValue(entry["version"]))
        }
    }

    return versions
}

func pluginVersions(root: URL) throws -> [String: VersionValue] {
    let pluginsURL = root.appendingPathComponent("plugins", isDirectory: true)
    let contents = try FileManager.default.contentsOfDirectory(
        at: pluginsURL,
        includingPropertiesForKeys: [.isDirectoryKey],
        options: [.skipsHiddenFiles]
    )

    var versions: [String: VersionValue] = [:]
    for pluginURL in contents.sorted(by: { $0.path < $1.path }) {
        let values = try pluginURL.resourceValues(forKeys: [.isDirectoryKey])
        guard values.isDirectory == true else { continue }

        let pluginJSON = pluginURL.appendingPathComponent(".claude-plugin/plugin.json")
        guard FileManager.default.fileExists(atPath: pluginJSON.path) else { continue }

        let data = try loadJSONObject(pluginJSON)
        versions[pluginURL.lastPathComponent] = VersionValue(raw: stringValue(data["version"]))
    }

    return versions
}

func checkSync(root: URL) throws -> [String] {
    let market = try marketplaceVersions(root: root)
    let plugins = try pluginVersions(root: root)
    var errors: [String] = []

    for name in plugins.keys.sorted() {
        let pluginVersion = plugins[name]?.raw
        guard market.keys.contains(name) else {
            errors.append("\(name): present in plugins/ but missing from marketplace.json plugins[]")
            continue
        }
        let marketplaceVersion = market[name]?.raw
        if pluginVersion != marketplaceVersion {
            errors.append("\(name): plugin.json version \(repr(pluginVersion)) != marketplace.json version \(repr(marketplaceVersion))")
        }
    }

    for name in market.keys.sorted() where !plugins.keys.contains(name) {
        errors.append("\(name): listed in marketplace.json but plugins/\(name)/.claude-plugin/plugin.json is missing")
    }

    return errors
}

func runGit(root: URL, _ args: [String]) throws -> String {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    process.arguments = ["git", "-C", root.path] + args

    let stdout = Pipe()
    let stderr = Pipe()
    process.standardOutput = stdout
    process.standardError = stderr

    try process.run()
    process.waitUntilExit()

    let stdoutData = stdout.fileHandleForReading.readDataToEndOfFile()
    let stderrData = stderr.fileHandleForReading.readDataToEndOfFile()
    let stdoutText = String(data: stdoutData, encoding: .utf8) ?? ""
    let stderrText = String(data: stderrData, encoding: .utf8) ?? ""

    guard process.terminationStatus == 0 else {
        let detail = stderrText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? stdoutText.trimmingCharacters(in: .whitespacesAndNewlines)
            : stderrText.trimmingCharacters(in: .whitespacesAndNewlines)
        throw ValidatorFailure(description: "git \(args.joined(separator: " ")) failed: \(detail)")
    }

    return stdoutText
}

func changedPlugins(root: URL, baseRef: String) throws -> Set<String> {
    let output = try runGit(root: root, ["diff", "--name-only", "\(baseRef)...HEAD"])
    var names = Set<String>()

    for line in output.split(separator: "\n") {
        let parts = line.split(separator: "/", omittingEmptySubsequences: false)
        if parts.count >= 2, parts[0] == "plugins" {
            names.insert(String(parts[1]))
        }
    }

    return names
}

func basePluginVersion(root: URL, baseRef: String, name: String) -> String? {
    let spec = "\(baseRef):plugins/\(name)/.claude-plugin/plugin.json"
    guard let raw = try? runGit(root: root, ["show", spec]),
          let data = raw.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
        return nil
    }

    return stringValue(object["version"])
}

func checkBump(root: URL, baseRef: String) throws -> [String] {
    let plugins = try pluginVersions(root: root)
    var errors: [String] = []

    for name in try changedPlugins(root: root, baseRef: baseRef).sorted() {
        guard let current = plugins[name]?.raw else {
            continue
        }
        guard let base = basePluginVersion(root: root, baseRef: baseRef, name: name) else {
            continue
        }
        if current == base {
            errors.append(
                "\(name): source changed under plugins/\(name)/ but plugin.json version is still \(repr(current)) (must be bumped versus \(baseRef))"
            )
        }
    }

    return errors
}

func emitJSON(_ object: [String: Any]) {
    let data = try! JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])
    print(String(data: data, encoding: .utf8)!)
}

let args: Arguments
do {
    args = try parseArguments(CommandLine.arguments)
} catch {
    print("::error::version-validator config error: \(error)")
    print(usage())
    Foundation.exit(2)
}

let root = URL(fileURLWithPath: args.repoRoot).standardizedFileURL

do {
    let syncErrors = try checkSync(root: root)
    let bumpErrors = args.baseRef.isEmpty ? [] : try checkBump(root: root, baseRef: args.baseRef)
    let errors = syncErrors + bumpErrors
    let ok = errors.isEmpty

    if args.emitJSON {
        emitJSON([
            "ok": ok,
            "sync_errors": syncErrors,
            "bump_errors": bumpErrors
        ])
    } else {
        for error in syncErrors {
            print("::error::[version sync] \(error)")
        }
        for error in bumpErrors {
            print("::error::[version bump] \(error)")
        }
        if ok {
            let scope = args.baseRef.isEmpty ? "sync" : "sync + bump"
            print("Version validator passed (\(scope) checks).")
        } else {
            print("\nVersion validator FAILED with \(errors.count) error(s).")
        }
    }

    Foundation.exit(ok ? 0 : 1)
} catch {
    if args.emitJSON {
        emitJSON(["ok": false, "config_error": "\(error)"])
    } else {
        print("::error::version-validator config error: \(error)")
    }
    Foundation.exit(2)
}

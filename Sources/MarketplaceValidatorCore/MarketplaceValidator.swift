import Foundation

public struct MarketplaceValidatorCLI {
    public init() {}

    public func run(arguments: [String], cwd: URL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)) -> Int32 {
        guard let command = arguments.first else {
            print("Usage: marketplace-validator <frontmatter|manifests> [options]", to: .standardError)
            return 2
        }

        let rest = Array(arguments.dropFirst())
        switch command {
        case "frontmatter", "validate-frontmatter":
            return FrontmatterCLI(repoRoot: cwd).run(arguments: rest)
        case "manifests", "validate-manifests":
            return ManifestCLI(repoRoot: cwd).run(arguments: rest)
        case "--help", "-h", "help":
            print("Usage: marketplace-validator <frontmatter|manifests> [options]")
            return 0
        default:
            print("Unknown validator command: \(command)", to: .standardError)
            return 2
        }
    }
}

// MARK: - Shared output

enum OutputStream {
    case standardError
}

func print(_ message: String, to stream: OutputStream) {
    switch stream {
    case .standardError:
        FileHandle.standardError.write(Data((message + "\n").utf8))
    }
}

func jsonString(_ object: Any) -> String {
    guard JSONSerialization.isValidJSONObject(object),
          let data = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys]),
          let text = String(data: data, encoding: .utf8) else {
        return "{}"
    }
    return text
}

func cleanRelativePath(_ path: String) -> String {
    path.hasPrefix("./") ? String(path.dropFirst(2)) : path
}

func containsPathTraversal(_ path: URL, inside root: URL) -> Bool {
    let resolvedPath = path.standardizedFileURL.path
    let rootPath = root.standardizedFileURL.path
    return !(resolvedPath == rootPath || resolvedPath.hasPrefix(rootPath + "/"))
}

// MARK: - Frontmatter validation

public struct FrontmatterIssue: Equatable {
    public var file: String
    public var line: Int
    public var message: String
    public var field: String?
    public var severity: String

    public init(file: String, line: Int, message: String, field: String? = nil, severity: String = "error") {
        self.file = file
        self.line = line
        self.message = message
        self.field = field
        self.severity = severity
    }

    var dictionary: [String: Any] {
        [
            "file": file,
            "line": line,
            "message": message,
            "field": field as Any,
            "severity": severity,
        ]
    }
}

public struct FrontmatterResult {
    public var errors: [FrontmatterIssue]
    public var warnings: [FrontmatterIssue]
    public var filesChecked: Int

    public var isValid: Bool { errors.isEmpty }

    var dictionary: [String: Any] {
        [
            "is_valid": isValid,
            "files_checked": filesChecked,
            "error_count": errors.count,
            "warning_count": warnings.count,
            "errors": errors.map(\.dictionary),
            "warnings": warnings.map(\.dictionary),
        ]
    }
}

public struct ParsedFrontmatter {
    public var fields: [String: Any]
    public var endLine: Int
    public var body: String
}

public enum FrontmatterValidator {
    static let validColors: Set<String> = ["blue", "green", "yellow", "red", "orange", "purple", "cyan", "pink"]
    static let allowedModels: Set<String> = ["haiku", "sonnet", "opus", "caller-owned"]
    static let agentFields: Set<String> = ["name", "description", "color", "tools", "skills", "context", "hooks", "model", "metadata", "memory", "isolation", "background"]
    static let commandFields: Set<String> = ["name", "description", "allowed-tools", "argument-hint", "skills", "metadata"]
    static let skillFields: Set<String> = ["name", "description", "allowed-tools", "context", "agent", "user-invocable", "metadata", "disable-model-invocation"]
    static let metadataFields: Set<String> = ["capabilities", "license"]
    static let mcpWrapperAgents: Set<String> = ["linear-service", "life-notion", "life-calendar", "company-sprint"]

    public static func extractFrontmatter(from content: String) -> ParsedFrontmatter? {
        guard content.hasPrefix("---") else { return nil }
        let lines = content.components(separatedBy: "\n")
        guard lines.count > 1 else { return nil }

        var endIndex: Int?
        for index in 1..<lines.count {
            if lines[index].trimmingCharacters(in: .whitespacesAndNewlines) == "---" {
                endIndex = index
                break
            }
        }
        guard let endIndex else { return nil }

        let frontmatterLines = Array(lines[1..<endIndex])
        let body = lines[(endIndex + 1)...].joined(separator: "\n")
        let fields = parseFrontmatterLines(frontmatterLines)
        guard !fields.isEmpty else { return nil }
        return ParsedFrontmatter(fields: fields, endLine: endIndex + 1, body: body)
    }

    static func parseFrontmatterLines(_ lines: [String]) -> [String: Any] {
        var fields: [String: Any] = [:]
        var currentParent: String?

        for rawLine in lines {
            let trimmed = rawLine.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty, !trimmed.hasPrefix("#") else { continue }

            if rawLine.first?.isWhitespace == true {
                if let parent = currentParent, case var child as [String: Any] = fields[parent], let colon = trimmed.firstIndex(of: ":") {
                    let key = String(trimmed[..<colon]).trimmingCharacters(in: .whitespaces).lowercased()
                    let value = String(trimmed[trimmed.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
                    child[key] = parseScalar(value)
                    fields[parent] = child
                }
                continue
            }

            guard let colon = trimmed.firstIndex(of: ":") else { continue }
            let key = String(trimmed[..<colon]).trimmingCharacters(in: .whitespaces).lowercased()
            let value = String(trimmed[trimmed.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
            if value.isEmpty {
                fields[key] = [String: Any]()
                currentParent = key
            } else {
                fields[key] = parseScalar(value)
                currentParent = nil
            }
        }

        return fields
    }

    static func parseScalar(_ value: String) -> Any {
        let trimmed = value.trimmingCharacters(in: .whitespaces)
        if trimmed == "true" { return true }
        if trimmed == "false" { return false }
        if trimmed.hasPrefix("\"") && trimmed.hasSuffix("\"") && trimmed.count >= 2 {
            return String(trimmed.dropFirst().dropLast())
        }
        if trimmed.hasPrefix("'") && trimmed.hasSuffix("'") && trimmed.count >= 2 {
            return String(trimmed.dropFirst().dropLast())
        }
        return trimmed
    }

    public static func fileType(for filePath: String) -> String? {
        let normalized = filePath.replacingOccurrences(of: "\\", with: "/")
        if normalized.range(of: #"plugins/[^/]+/agents/[^/]+\.md$"#, options: .regularExpression) != nil { return "agent" }
        if normalized.range(of: #"plugins/[^/]+/commands/[^/]+\.md$"#, options: .regularExpression) != nil { return "command" }
        if normalized.range(of: #"plugins/[^/]+/skills/[^/]+/SKILL\.md$"#, options: .regularExpression) != nil { return "skill" }
        return nil
    }

    public static func validateFile(_ fileURL: URL, displayPath: String? = nil) -> (errors: [FrontmatterIssue], warnings: [FrontmatterIssue]) {
        let path = displayPath ?? fileURL.path
        guard let type = fileType(for: path) else { return ([], []) }

        let content: String
        do {
            content = try String(contentsOf: fileURL, encoding: .utf8)
        } catch {
            return ([FrontmatterIssue(file: path, line: 1, message: "Cannot read file: \(error.localizedDescription)")], [])
        }

        guard let parsed = extractFrontmatter(from: content) else {
            return ([FrontmatterIssue(file: path, line: 1, message: "Missing or invalid YAML frontmatter")], [])
        }

        switch type {
        case "agent": return validateAgent(parsed.fields, filePath: path, body: parsed.body)
        case "command": return validateCommand(parsed.fields, filePath: path, body: parsed.body)
        case "skill": return validateSkill(parsed.fields, filePath: path, body: parsed.body)
        default: return ([], [])
        }
    }

    public static func validateAgent(_ frontmatter: [String: Any], filePath: String, body: String) -> (errors: [FrontmatterIssue], warnings: [FrontmatterIssue]) {
        var errors: [FrontmatterIssue] = []
        var warnings: [FrontmatterIssue] = []

        if frontmatter["allowed-tools"] != nil && frontmatter["tools"] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Agents must use 'tools', not 'allowed-tools'", field: "allowed-tools"))
        }

        for field in ["name", "description", "color", "tools"] where frontmatter[field] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing required field '\(field)'", field: field))
        }

        if let model = frontmatter["model"] as? String {
            if model == "inherit" {
                errors.append(FrontmatterIssue(file: filePath, line: 1, message: "model: inherit is banned - pin a real tier (haiku/sonnet/opus) or declare model: caller-owned", field: "model"))
            } else if !allowedModels.contains(model) {
                errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Invalid model '\(model)'. Valid: \(allowedModels.sorted().joined(separator: ", "))", field: "model"))
            }
        } else {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing required field 'model' - pin a tier (haiku/sonnet/opus) or declare model: caller-owned", field: "model"))
        }

        if frontmatter["skills"] == nil {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing recommended field 'skills' - agents should have skills for discoverability", field: "skills", severity: "warning"))
        }

        let metadata = frontmatter["metadata"] as? [String: Any] ?? [:]
        if metadata["capabilities"] == nil {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing 'metadata.capabilities' - agents should have capabilities for discoverability", field: "metadata.capabilities", severity: "warning"))
        }

        if let name = frontmatter["name"] as? String, !validateLowercaseHyphenated(name) {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Field 'name' must be lowercase-hyphenated (got: \(name))", field: "name"))
        }

        if let color = frontmatter["color"] as? String, !validColors.contains(color) {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Invalid color '\(color)'. Valid: \(validColors.sorted().joined(separator: ", "))", field: "color"))
        }

        if let tools = frontmatter["tools"] as? String, let agentName = frontmatter["name"] as? String, let mcpIssue = checkMcpTools(tools, agentName: agentName) {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Non-wrapper agent has MCP tools: \(mcpIssue)", field: "tools", severity: "warning"))
        }

        for line in checkAbsolutePaths(body).prefix(3) {
            warnings.append(FrontmatterIssue(file: filePath, line: line, message: "Use ${CLAUDE_PLUGIN_ROOT} instead of absolute paths", severity: "warning"))
        }

        for field in frontmatter.keys.sorted() {
            if metadataFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Field '\(field)' should be under 'metadata:' block", field: field, severity: "warning"))
            } else if !agentFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Non-standard field '\(field)' - wrap in 'metadata:' block", field: field, severity: "warning"))
            }
        }

        return (errors, warnings)
    }

    public static func validateCommand(_ frontmatter: [String: Any], filePath: String, body: String) -> (errors: [FrontmatterIssue], warnings: [FrontmatterIssue]) {
        var errors: [FrontmatterIssue] = []
        var warnings: [FrontmatterIssue] = []

        if frontmatter["tools"] != nil && frontmatter["allowed-tools"] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Commands must use 'allowed-tools', not 'tools'", field: "tools"))
        }

        if frontmatter["description"] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing required field 'description'", field: "description"))
        }

        if frontmatter["tools"] == nil && frontmatter["allowed-tools"] == nil {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing 'tools' field - commands typically need tools to execute", field: "tools", severity: "warning"))
        }

        if !body.contains("$ARGUMENTS") {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Command missing $ARGUMENTS placeholder - commands should include user input", severity: "warning"))
        }

        if checkTableRouting(body) {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Table-based routing detected - use natural language bullet points instead", severity: "warning"))
        }

        for field in frontmatter.keys.sorted() {
            if metadataFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Field '\(field)' should be under 'metadata:' block", field: field, severity: "warning"))
            } else if !commandFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Non-standard field '\(field)' - wrap in 'metadata:' block", field: field, severity: "warning"))
            }
        }

        return (errors, warnings)
    }

    public static func validateSkill(_ frontmatter: [String: Any], filePath: String, body: String) -> (errors: [FrontmatterIssue], warnings: [FrontmatterIssue]) {
        var errors: [FrontmatterIssue] = []
        var warnings: [FrontmatterIssue] = []

        if frontmatter["tools"] != nil && frontmatter["allowed-tools"] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Skills must use 'allowed-tools', not 'tools'", field: "tools"))
        }

        for field in ["name", "description"] where frontmatter[field] == nil {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Missing required field '\(field)'", field: field))
        }

        if let name = frontmatter["name"] as? String {
            if !validateLowercaseHyphenated(name) {
                errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Field 'name' must be lowercase-hyphenated (got: \(name))", field: "name"))
            }
            if let directoryName = skillDirectoryName(from: filePath), name != directoryName {
                errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Skill name '\(name)' must match directory name '\(directoryName)'", field: "name"))
            }
        }

        if let description = frontmatter["description"] as? String, !description.isEmpty, description.count < 20 {
            warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Description too short - should explain WHAT the skill provides AND WHEN to use it", field: "description", severity: "warning"))
        }

        if body.contains("$ARGUMENTS") {
            errors.append(FrontmatterIssue(file: filePath, line: 1, message: "Skills cannot use $ARGUMENTS - they receive no user input. Use commands or agents instead."))
        }

        for field in frontmatter.keys.sorted() {
            if metadataFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Field '\(field)' should be under 'metadata:' block", field: field, severity: "warning"))
            } else if !skillFields.contains(field) {
                warnings.append(FrontmatterIssue(file: filePath, line: 1, message: "Non-standard field '\(field)' - wrap in 'metadata:' block", field: field, severity: "warning"))
            }
        }

        return (errors, warnings)
    }

    public static func validateLowercaseHyphenated(_ value: String) -> Bool {
        value.range(of: #"^_?[a-z][a-z0-9-]*$"#, options: .regularExpression) != nil
    }

    public static func checkTableRouting(_ content: String) -> Bool {
        let patterns = [
            #"\|\s*(Keyword|Trigger|Command|Input|First Word)\s*\|\s*(Action|Agent|Route)"#,
            #"\|\s*\w+\s*\|\s*(code-reviewer|engineer|architect)"#,
        ]
        return patterns.contains { content.range(of: $0, options: [.regularExpression, .caseInsensitive]) != nil }
    }

    public static func checkAbsolutePaths(_ content: String) -> [Int] {
        var lines: [Int] = []
        for (index, line) in content.components(separatedBy: "\n").enumerated() {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("#") || trimmed.hasPrefix("//") { continue }
            if line.range(of: #"(/Users/|/home/|~/\.claude/plugins/)"#, options: .regularExpression) != nil {
                lines.append(index + 1)
            }
        }
        return lines
    }

    public static func checkMcpTools(_ tools: String, agentName: String) -> String? {
        if tools.isEmpty || mcpWrapperAgents.contains(agentName) { return nil }
        let patterns: [(String, String)] = [
            (#"mcp__(?!claude_ai_Linear).*linear"#, "Linear MCP - delegate to linear-service agent"),
            (#"mcp__.*[Nn]otion"#, "Notion MCP - delegate to life-notion agent"),
            (#"mcp__.*calendar"#, "Calendar MCP - delegate to life-calendar agent"),
        ]
        for (pattern, message) in patterns where tools.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil {
            return message
        }
        return nil
    }

    static func skillDirectoryName(from filePath: String) -> String? {
        let parts = filePath.replacingOccurrences(of: "\\", with: "/").split(separator: "/").map(String.init)
        guard parts.count >= 3, parts.last == "SKILL.md" else { return nil }
        return parts[parts.count - 2]
    }

    public static func findPluginFiles(repoRoot: URL) -> [URL] {
        let plugins = repoRoot.appendingPathComponent("plugins", isDirectory: true)
        guard let pluginDirs = try? FileManager.default.contentsOfDirectory(at: plugins, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles]) else { return [] }
        var files: [URL] = []
        for plugin in pluginDirs.sorted(by: { $0.path < $1.path }) {
            guard (try? plugin.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true else { continue }
            files += markdownFiles(in: plugin.appendingPathComponent("agents", isDirectory: true))
            files += markdownFiles(in: plugin.appendingPathComponent("commands", isDirectory: true))
            let skillsDir = plugin.appendingPathComponent("skills", isDirectory: true)
            if let skillDirs = try? FileManager.default.contentsOfDirectory(at: skillsDir, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles]) {
                for skill in skillDirs.sorted(by: { $0.path < $1.path }) where (try? skill.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true {
                    let skillFile = skill.appendingPathComponent("SKILL.md")
                    if FileManager.default.fileExists(atPath: skillFile.path) { files.append(skillFile) }
                }
            }
        }
        return files
    }

    static func markdownFiles(in directory: URL) -> [URL] {
        guard let files = try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.isRegularFileKey], options: [.skipsHiddenFiles]) else { return [] }
        return files.filter { $0.pathExtension == "md" }.sorted(by: { $0.path < $1.path })
    }
}

struct FrontmatterCLI {
    let repoRoot: URL

    func run(arguments: [String]) -> Int32 {
        var json = false
        var changed = false
        var strict = false
        var quiet = false
        var noWarnings = false

        var index = 0
        while index < arguments.count {
            switch arguments[index] {
            case "--json": json = true
            case "--changed": changed = true
            case "--strict": strict = true
            case "--quiet", "-q": quiet = true
            case "--no-warnings": noWarnings = true
            case "--help", "-h":
                print("Usage: marketplace-validator frontmatter [--json] [--changed] [--strict] [--quiet] [--no-warnings]")
                return 0
            default:
                print("Unknown frontmatter option: \(arguments[index])", to: .standardError)
                return 2
            }
            index += 1
        }

        let files = changed ? changedFiles() : FrontmatterValidator.findPluginFiles(repoRoot: repoRoot)
        if files.isEmpty {
            if !quiet {
                if json {
                    print(jsonString(["is_valid": true, "files_checked": 0, "errors": [], "warnings": []]))
                } else {
                    print("No files to validate")
                }
            }
            return 0
        }

        var errors: [FrontmatterIssue] = []
        var warnings: [FrontmatterIssue] = []
        for file in files {
            let relative = relativePath(file)
            let result = FrontmatterValidator.validateFile(file, displayPath: relative)
            errors += result.errors
            warnings += result.warnings
        }

        if strict {
            errors += warnings.map { FrontmatterIssue(file: $0.file, line: $0.line, message: $0.message, field: $0.field, severity: $0.severity) }
            warnings = []
        }

        let result = FrontmatterResult(errors: errors, warnings: warnings, filesChecked: files.count)
        if !quiet {
            if json {
                print(jsonString(result.dictionary))
            } else {
                print(formatText(result: result, showWarnings: !noWarnings))
            }
        }
        return result.isValid ? 0 : 1
    }

    func changedFiles() -> [URL] {
        let candidates = runGit(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"])
            ?? runGit(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"])
            ?? []
        return candidates.filter { $0.hasPrefix("plugins/") && $0.hasSuffix(".md") }
            .map { repoRoot.appendingPathComponent($0) }
            .filter { FileManager.default.fileExists(atPath: $0.path) }
    }

    func runGit(_ args: [String]) -> [String]? {
        let process = Process()
        process.currentDirectoryURL = repoRoot
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = ["git"] + args
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = Pipe()
        do { try process.run() } catch { return nil }
        process.waitUntilExit()
        guard process.terminationStatus == 0 else { return nil }
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        guard let text = String(data: data, encoding: .utf8), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return [] }
        return text.split(separator: "\n").map(String.init)
    }

    func relativePath(_ url: URL) -> String {
        let root = repoRoot.standardizedFileURL.path
        let path = url.standardizedFileURL.path
        if path.hasPrefix(root + "/") { return String(path.dropFirst(root.count + 1)) }
        return path
    }

    func formatText(result: FrontmatterResult, showWarnings: Bool) -> String {
        var lines: [String] = []
        if result.isValid && result.warnings.isEmpty {
            lines.append("OK: All \(result.filesChecked) files valid")
        } else if result.isValid {
            lines.append("OK: \(result.filesChecked) files valid with \(result.warnings.count) warning(s)")
        } else {
            lines.append("ERROR: Found \(result.errors.count) error(s) in \(result.filesChecked) files")
        }

        appendIssues(&lines, title: "ERRORS", issues: result.errors)
        if showWarnings { appendIssues(&lines, title: "WARNINGS", issues: result.warnings) }
        return lines.joined(separator: "\n")
    }

    func appendIssues(_ lines: inout [String], title: String, issues: [FrontmatterIssue]) {
        guard !issues.isEmpty else { return }
        lines.append("")
        lines.append(title + ":")
        let grouped = Dictionary(grouping: issues, by: \.file)
        for file in grouped.keys.sorted() {
            lines.append("  \(file):")
            for issue in grouped[file] ?? [] {
                let field = issue.field.map { " [\($0)]" } ?? ""
                lines.append("    Line \(issue.line)\(field): \(issue.message)")
            }
            lines.append("")
        }
    }
}

// MARK: - Manifest validation

public struct ManifestError: Equatable {
    public var pluginName: String
    public var fileType: String
    public var declaredPath: String
    public var expectedPath: String
    public var error: String

    public init(pluginName: String, fileType: String, declaredPath: String, expectedPath: String, error: String) {
        self.pluginName = pluginName
        self.fileType = fileType
        self.declaredPath = declaredPath
        self.expectedPath = expectedPath
        self.error = error
    }

    var dictionary: [String: Any] {
        ["plugin_name": pluginName, "file_type": fileType, "declared_path": declaredPath, "expected_path": expectedPath, "error": error]
    }
}

public struct PluginValidationResult: Equatable {
    public var pluginName: String
    public var pluginSource: String
    public var errors: [ManifestError] = []
    public var agentsChecked = 0
    public var commandsChecked = 0
    public var skillsChecked = 0
    public var hooksChecked = 0

    public init(pluginName: String, pluginSource: String) {
        self.pluginName = pluginName
        self.pluginSource = pluginSource
    }

    public var isValid: Bool { errors.isEmpty }
    public var totalChecked: Int { agentsChecked + commandsChecked + skillsChecked + hooksChecked }

    var dictionary: [String: Any] {
        [
            "plugin_name": pluginName,
            "plugin_source": pluginSource,
            "is_valid": isValid,
            "errors": errors.map(\.dictionary),
            "agents_checked": agentsChecked,
            "commands_checked": commandsChecked,
            "skills_checked": skillsChecked,
            "hooks_checked": hooksChecked,
            "total_checked": totalChecked,
        ]
    }
}

public struct FullManifestResult: Equatable {
    public var manifestPath: String
    public var pluginResults: [PluginValidationResult] = []
    public var manifestErrors: [String] = []
    public var unregisteredPluginDirs: [String] = []

    public init(manifestPath: String) {
        self.manifestPath = manifestPath
    }

    public var isValid: Bool { manifestErrors.isEmpty && unregisteredPluginDirs.isEmpty && pluginResults.allSatisfy(\.isValid) }
    public var totalErrors: Int { manifestErrors.count + unregisteredPluginDirs.count + pluginResults.reduce(0) { $0 + $1.errors.count } }
    public var totalChecked: Int { pluginResults.reduce(0) { $0 + $1.totalChecked } }

    var dictionary: [String: Any] {
        [
            "manifest_path": manifestPath,
            "is_valid": isValid,
            "total_errors": totalErrors,
            "total_checked": totalChecked,
            "manifest_errors": manifestErrors,
            "unregistered_plugin_dirs": unregisteredPluginDirs,
            "plugin_results": pluginResults.map(\.dictionary),
        ]
    }
}

public enum ManifestValidator {
    public static func resolvePath(_ declaredPath: String, pluginDir: URL) -> (URL?, String?) {
        if declaredPath.hasPrefix("/") { return (nil, "Absolute paths not allowed: \(declaredPath)") }
        let clean = cleanRelativePath(declaredPath)
        let resolved = pluginDir.appendingPathComponent(clean).standardizedFileURL
        if containsPathTraversal(resolved, inside: pluginDir) { return (nil, "Path traversal detected: \(declaredPath)") }
        return (resolved, nil)
    }

    public static func validateManifestPaths(manifestURL: URL, baseDir: URL? = nil) -> FullManifestResult {
        var result = FullManifestResult(manifestPath: manifestURL.path)
        guard FileManager.default.fileExists(atPath: manifestURL.path) else {
            result.manifestErrors.append("Manifest not found: \(manifestURL.path)")
            return result
        }
        let root = baseDir ?? manifestURL.deletingLastPathComponent()

        let object: Any
        do {
            let data = try Data(contentsOf: manifestURL)
            object = try JSONSerialization.jsonObject(with: data)
        } catch let error as NSError where error.domain == NSCocoaErrorDomain || error.domain == NSURLErrorDomain {
            result.manifestErrors.append("Error reading manifest: \(error.localizedDescription)")
            return result
        } catch {
            result.manifestErrors.append("Invalid JSON: \(error)")
            return result
        }

        guard let manifest = object as? [String: Any], let plugins = manifest["plugins"] as? [[String: Any]], !plugins.isEmpty else {
            result.manifestErrors.append("No plugins found in manifest")
            return result
        }

        result.pluginResults = plugins.map { validatePlugin($0, baseDir: root) }
        result.unregisteredPluginDirs = findUnregisteredPluginDirs(baseDir: root, plugins: plugins)
        return result
    }

    public static func validateRootManifest(repoRoot: URL) -> FullManifestResult {
        let manifest = repoRoot.appendingPathComponent(".claude-plugin/marketplace.json")
        guard FileManager.default.fileExists(atPath: manifest.path) else {
            var result = FullManifestResult(manifestPath: "not found")
            result.manifestErrors.append("Marketplace manifest not found at \(manifest.path)")
            return result
        }
        return validateManifestPaths(manifestURL: manifest, baseDir: repoRoot)
    }

    public static func validatePlugin(_ plugin: [String: Any], baseDir: URL) -> PluginValidationResult {
        let name = plugin["name"] as? String ?? "unknown"
        let source = plugin["source"] as? String ?? "./plugins/\(name)"
        var result = PluginValidationResult(pluginName: name, pluginSource: source)

        if source.hasPrefix("/") {
            result.errors.append(ManifestError(pluginName: name, fileType: "source", declaredPath: source, expectedPath: "(absolute paths not allowed)", error: "absolute_path_not_allowed"))
            return result
        }

        let pluginDir = baseDir.appendingPathComponent(cleanRelativePath(source)).standardizedFileURL
        if containsPathTraversal(pluginDir, inside: baseDir) {
            result.errors.append(ManifestError(pluginName: name, fileType: "source", declaredPath: source, expectedPath: "(path traversal detected)", error: "path_traversal_detected"))
            return result
        }

        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: pluginDir.path, isDirectory: &isDir), isDir.boolValue else {
            result.errors.append(ManifestError(pluginName: name, fileType: "source", declaredPath: source, expectedPath: pluginDir.path, error: "missing_directory"))
            return result
        }

        for path in stringArray(plugin["agents"]) {
            result.agentsChecked += 1
            validateFilePath(path, pluginDir: pluginDir, pluginName: name, fileType: "agent", result: &result)
        }
        for path in stringArray(plugin["commands"]) {
            result.commandsChecked += 1
            validateFilePath(path, pluginDir: pluginDir, pluginName: name, fileType: "command", result: &result)
        }
        for path in stringArray(plugin["skills"]) {
            result.skillsChecked += 1
            validateSkillPath(path, pluginDir: pluginDir, pluginName: name, result: &result)
        }
        if let hooks = plugin["hooks"] as? String, !hooks.isEmpty {
            result.hooksChecked += 1
            validateFilePath(hooks, pluginDir: pluginDir, pluginName: name, fileType: "hook", result: &result)
        }
        return result
    }

    static func stringArray(_ value: Any?) -> [String] {
        if let strings = value as? [String] { return strings }
        if let values = value as? [Any] { return values.compactMap { $0 as? String } }
        return []
    }

    static func validateFilePath(_ path: String, pluginDir: URL, pluginName: String, fileType: String, result: inout PluginValidationResult) {
        let resolved = resolvePath(path, pluginDir: pluginDir)
        if let error = resolved.1 {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: fileType, declaredPath: path, expectedPath: "(invalid path)", error: error))
        } else if let url = resolved.0, !FileManager.default.fileExists(atPath: url.path) {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: fileType, declaredPath: path, expectedPath: url.path, error: "missing_file"))
        }
    }

    static func validateSkillPath(_ path: String, pluginDir: URL, pluginName: String, result: inout PluginValidationResult) {
        let resolved = resolvePath(path, pluginDir: pluginDir)
        if let error = resolved.1 {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: "skill", declaredPath: path, expectedPath: "(invalid path)", error: error))
            return
        }
        guard let skillDir = resolved.0 else { return }
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: skillDir.path, isDirectory: &isDir) else {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: "skill", declaredPath: path, expectedPath: skillDir.path, error: "missing_skill_dir"))
            return
        }
        guard isDir.boolValue else {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: "skill", declaredPath: path, expectedPath: skillDir.path, error: "not_a_directory"))
            return
        }
        let skillMD = skillDir.appendingPathComponent("SKILL.md")
        if !FileManager.default.fileExists(atPath: skillMD.path) {
            result.errors.append(ManifestError(pluginName: pluginName, fileType: "skill", declaredPath: path, expectedPath: skillMD.path, error: "missing_skill_md"))
        }
    }

    static func findUnregisteredPluginDirs(baseDir: URL, plugins: [[String: Any]]) -> [String] {
        let pluginsRoot = baseDir.appendingPathComponent("plugins", isDirectory: true)
        guard let entries = try? FileManager.default.contentsOfDirectory(at: pluginsRoot, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles]) else { return [] }
        var registered = Set<String>()
        for plugin in plugins {
            guard let source = plugin["source"] as? String else { continue }
            registered.insert(URL(fileURLWithPath: cleanRelativePath(source)).lastPathComponent)
        }
        return entries.filter { (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true && !registered.contains($0.lastPathComponent) }
            .map { "plugins/\($0.lastPathComponent)" }
            .sorted()
    }

    public static func formatValidationText(_ result: FullManifestResult) -> String {
        var lines: [String] = []
        lines.append(String(repeating: "=", count: 50))
        lines.append("MANIFEST VALIDATION")
        lines.append(String(repeating: "=", count: 50))
        lines.append("Manifest: \(result.manifestPath)")
        lines.append("Total items checked: \(result.totalChecked)")
        lines.append("")

        if !result.manifestErrors.isEmpty {
            lines.append("Manifest Errors:")
            result.manifestErrors.forEach { lines.append("  x \($0)") }
            lines.append("")
        }
        if !result.unregisteredPluginDirs.isEmpty {
            lines.append("Unregistered Plugin Directories:")
            result.unregisteredPluginDirs.forEach { lines.append("  x \($0) (no marketplace.json entry)") }
            lines.append("")
        }

        let invalid = result.pluginResults.filter { !$0.isValid }
        let valid = result.pluginResults.filter(\.isValid)
        if !invalid.isEmpty {
            lines.append("Plugins with Errors:")
            for plugin in invalid {
                lines.append("  x \(plugin.pluginName) (\(plugin.errors.count) errors)")
                for error in plugin.errors {
                    lines.append("    - \(error.fileType): \(error.declaredPath)")
                    lines.append("      Error: \(error.error)")
                    lines.append("      Expected: \(error.expectedPath)")
                }
            }
            lines.append("")
        }
        if !valid.isEmpty {
            lines.append("Valid Plugins:")
            valid.forEach { lines.append("  + \($0.pluginName) (\($0.totalChecked) items)") }
            lines.append("")
        }
        lines.append(String(repeating: "-", count: 50))
        lines.append(result.isValid ? "+ All manifest paths validated successfully" : "x Found \(result.totalErrors) errors")
        lines.append("")
        return lines.joined(separator: "\n")
    }

    public static func formatFixSuggestions(_ result: FullManifestResult) -> String {
        if result.isValid { return "No fixes needed - all paths are valid." }
        var lines: [String] = []
        lines.append(String(repeating: "=", count: 50))
        lines.append("FIX SUGGESTIONS")
        lines.append(String(repeating: "=", count: 50))
        lines.append("")
        lines.append("These are suggestions only. Review before applying.")
        lines.append("")

        for plugin in result.pluginResults where !plugin.isValid {
            lines.append("Plugin: \(plugin.pluginName)")
            lines.append(String(repeating: "-", count: 30))
            for error in plugin.errors {
                switch error.error {
                case "missing_file":
                    lines.append("  Option 1: Create missing \(error.fileType)")
                    lines.append("    touch \(error.expectedPath)")
                    lines.append("")
                    lines.append("  Option 2: Remove from manifest")
                    lines.append("    Remove '\(error.declaredPath)' from \(error.fileType)s array")
                    lines.append("")
                case "missing_skill_dir":
                    lines.append("  Option 1: Create skill directory")
                    lines.append("    mkdir -p \(error.expectedPath)")
                    lines.append("    touch \(error.expectedPath)/SKILL.md")
                    lines.append("")
                    lines.append("  Option 2: Remove from manifest")
                    lines.append("    Remove '\(error.declaredPath)' from skills array")
                    lines.append("")
                case "missing_skill_md":
                    lines.append("  Create SKILL.md:")
                    lines.append("    touch \(error.expectedPath)")
                    lines.append("")
                case "missing_directory":
                    lines.append("  Plugin source directory missing:")
                    lines.append("    mkdir -p \(error.expectedPath)")
                    lines.append("")
                default:
                    continue
                }
            }
        }
        return lines.joined(separator: "\n")
    }
}

struct ManifestCLI {
    let repoRoot: URL

    func run(arguments: [String]) -> Int32 {
        var json = false
        var fix = false
        var quiet = false
        var manifestPath: String?

        var index = 0
        while index < arguments.count {
            switch arguments[index] {
            case "--json": json = true
            case "--fix": fix = true
            case "--quiet", "-q": quiet = true
            case "--path":
                index += 1
                guard index < arguments.count else {
                    print("--path requires a value", to: .standardError)
                    return 2
                }
                manifestPath = arguments[index]
            case "--help", "-h":
                print("Usage: marketplace-validator manifests [--json] [--fix] [--path manifest.json] [--quiet]")
                return 0
            default:
                print("Unknown manifest option: \(arguments[index])", to: .standardError)
                return 2
            }
            index += 1
        }

        let result: FullManifestResult
        if let manifestPath {
            let url = URL(fileURLWithPath: manifestPath, relativeTo: repoRoot).standardizedFileURL
            if !FileManager.default.fileExists(atPath: url.path) {
                if !quiet {
                    if json { print(jsonString(["error": "Manifest not found: \(url.path)", "is_valid": false])) }
                    else { print("Error: Manifest not found: \(url.path)") }
                }
                return 2
            }
            result = ManifestValidator.validateManifestPaths(manifestURL: url)
        } else {
            result = ManifestValidator.validateRootManifest(repoRoot: repoRoot)
            if result.manifestPath == "not found" {
                if !quiet {
                    if json { print(jsonString(["error": "Root manifest not found", "is_valid": false])) }
                    else {
                        print("Error: Root manifest not found")
                        print("  Expected: .claude-plugin/marketplace.json")
                    }
                }
                return 2
            }
        }

        if quiet { return result.isValid ? 0 : 1 }
        if json {
            print(jsonString(result.dictionary))
        } else {
            print(ManifestValidator.formatValidationText(result))
            if fix && !result.isValid {
                print("")
                print(ManifestValidator.formatFixSuggestions(result))
            }
        }
        return result.isValid ? 0 : 1
    }
}

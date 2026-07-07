import XCTest
@testable import MarketplaceValidatorCore

final class FrontmatterValidatorTests: XCTestCase {
    func testExtractValidFrontmatter() throws {
        let parsed = try XCTUnwrap(FrontmatterValidator.extractFrontmatter(from: "---\nname: my-agent\ndescription: A test\ncolor: blue\n---\n\nBody here"))
        XCTAssertEqual(parsed.fields["name"] as? String, "my-agent")
        XCTAssertEqual(parsed.fields["description"] as? String, "A test")
        XCTAssertEqual(parsed.fields["color"] as? String, "blue")
        XCTAssertTrue(parsed.body.contains("Body here"))
    }

    func testMissingFrontmatterReturnsNil() {
        XCTAssertNil(FrontmatterValidator.extractFrontmatter(from: "Just markdown"))
        XCTAssertNil(FrontmatterValidator.extractFrontmatter(from: "---\nname: open"))
    }

    func testFallbackStyleColonValuesAreAccepted() throws {
        let parsed = try XCTUnwrap(FrontmatterValidator.extractFrontmatter(from: "---\nname: my-agent\ndescription: Context: this has colons: everywhere\ncolor: blue\n---\n\nBody"))
        XCTAssertEqual(parsed.fields["name"] as? String, "my-agent")
        XCTAssertEqual(parsed.fields["color"] as? String, "blue")
    }

    func testValidAgentHasNoErrors() {
        let fields: [String: Any] = [
            "name": "test-agent",
            "description": "A test agent",
            "color": "blue",
            "tools": "Read, Write",
            "skills": "test-skill",
            "metadata": ["capabilities": "[testing]"],
            "model": "sonnet",
        ]
        let result = FrontmatterValidator.validateAgent(fields, filePath: "plugins/p/agents/a.md", body: "")
        XCTAssertTrue(result.errors.isEmpty)
    }

    func testAgentRequiredFieldsAndColor() {
        let missing = FrontmatterValidator.validateAgent([:], filePath: "plugins/p/agents/a.md", body: "")
        XCTAssertTrue(missing.errors.contains { $0.field == "name" })
        XCTAssertTrue(missing.errors.contains { $0.field == "description" })
        XCTAssertTrue(missing.errors.contains { $0.field == "color" })
        XCTAssertTrue(missing.errors.contains { $0.field == "tools" })

        let invalid = FrontmatterValidator.validateAgent(["name": "My Agent", "description": "Test", "color": "rainbow", "tools": "Read"], filePath: "plugins/p/agents/a.md", body: "")
        XCTAssertTrue(invalid.errors.contains { $0.field == "name" })
        XCTAssertTrue(invalid.errors.contains { $0.field == "color" })
    }

    func testAgentWarnings() {
        let result = FrontmatterValidator.validateAgent(["name": "test-agent", "description": "Test", "color": "blue", "tools": "Read", "capabilities": "[testing]", "foobar": "baz"], filePath: "plugins/p/agents/a.md", body: "Read /Users/foo/bar")
        XCTAssertTrue(result.warnings.contains { $0.field == "skills" })
        XCTAssertTrue(result.warnings.contains { $0.field == "metadata.capabilities" })
        XCTAssertTrue(result.warnings.contains { $0.field == "capabilities" })
        XCTAssertTrue(result.warnings.contains { $0.field == "foobar" })
        XCTAssertTrue(result.warnings.contains { $0.message.contains("CLAUDE_PLUGIN_ROOT") })
    }

    func testCommandValidation() {
        let valid = FrontmatterValidator.validateCommand(["description": "Test command", "allowed-tools": "Read"], filePath: "plugins/p/commands/c.md", body: "Run $ARGUMENTS")
        XCTAssertTrue(valid.errors.isEmpty)

        let invalid = FrontmatterValidator.validateCommand(["tools": "Read"], filePath: "plugins/p/commands/c.md", body: "| Keyword | Action |\n| review | code-reviewer |")
        XCTAssertTrue(invalid.errors.contains { $0.field == "tools" })
        XCTAssertTrue(invalid.errors.contains { $0.field == "description" })
        XCTAssertTrue(invalid.warnings.contains { $0.message.contains("ARGUMENTS") })
        XCTAssertTrue(invalid.warnings.contains { $0.message.lowercased().contains("routing") })
    }

    func testSkillValidation() {
        let internalSkill = FrontmatterValidator.validateSkill(["name": "_context", "description": "Shared context skill for internal routing"], filePath: "plugins/p/skills/_context/SKILL.md", body: "")
        XCTAssertTrue(internalSkill.errors.isEmpty)

        let valid = FrontmatterValidator.validateSkill(["name": "test-skill", "description": "A test skill that does useful things"], filePath: "plugins/p/skills/test-skill/SKILL.md", body: "")
        XCTAssertTrue(valid.errors.isEmpty)

        let invalid = FrontmatterValidator.validateSkill(["name": "other-skill", "description": "Short", "tools": "Read"], filePath: "plugins/p/skills/test-skill/SKILL.md", body: "Use $ARGUMENTS")
        XCTAssertTrue(invalid.errors.contains { $0.field == "tools" })
        XCTAssertTrue(invalid.errors.contains { $0.message.contains("must match") })
        XCTAssertTrue(invalid.errors.contains { $0.message.contains("ARGUMENTS") })
        XCTAssertTrue(invalid.warnings.contains { $0.message.lowercased().contains("short") })
    }

    func testPathClassificationAndMcpTools() {
        XCTAssertEqual(FrontmatterValidator.fileType(for: "plugins/foo/agents/bar.md"), "agent")
        XCTAssertEqual(FrontmatterValidator.fileType(for: "plugins/foo/commands/bar.md"), "command")
        XCTAssertEqual(FrontmatterValidator.fileType(for: "plugins/foo/skills/bar/SKILL.md"), "skill")
        XCTAssertNil(FrontmatterValidator.fileType(for: "plugins/foo/other/bar.md"))
        XCTAssertNil(FrontmatterValidator.checkMcpTools("mcp__linear__get_issues", agentName: "linear-service"))
        XCTAssertNotNil(FrontmatterValidator.checkMcpTools("mcp__linear__get_issues", agentName: "my-agent"))
    }
}

final class ManifestValidatorTests: XCTestCase {
    func testResolvePath() throws {
        let root = temporaryDirectory()
        let plugin = root.appendingPathComponent("plugins/test-plugin", isDirectory: true)
        try FileManager.default.createDirectory(at: plugin.appendingPathComponent("agents", isDirectory: true), withIntermediateDirectories: true)
        let resolved = ManifestValidator.resolvePath("./agents/foo.md", pluginDir: plugin)
        XCTAssertNil(resolved.1)
        XCTAssertEqual(resolved.0?.path, plugin.appendingPathComponent("agents/foo.md").standardizedFileURL.path)
        XCTAssertNotNil(ManifestValidator.resolvePath("/etc/passwd", pluginDir: plugin).1)
        XCTAssertNotNil(ManifestValidator.resolvePath("../../etc/passwd", pluginDir: plugin).1)
    }

    func testValidatePluginValidAndMissingPaths() throws {
        let root = temporaryDirectory()
        let plugin = root.appendingPathComponent("plugins/test-plugin", isDirectory: true)
        try FileManager.default.createDirectory(at: plugin.appendingPathComponent("agents", isDirectory: true), withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: plugin.appendingPathComponent("commands", isDirectory: true), withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: plugin.appendingPathComponent("skills/test-skill", isDirectory: true), withIntermediateDirectories: true)
        try "agent".write(to: plugin.appendingPathComponent("agents/helper.md"), atomically: true, encoding: .utf8)
        try "command".write(to: plugin.appendingPathComponent("commands/run.md"), atomically: true, encoding: .utf8)
        try "skill".write(to: plugin.appendingPathComponent("skills/test-skill/SKILL.md"), atomically: true, encoding: .utf8)

        let valid = ManifestValidator.validatePlugin(["name": "test-plugin", "source": "./plugins/test-plugin", "agents": ["agents/helper.md"], "commands": ["commands/run.md"], "skills": ["skills/test-skill"]], baseDir: root)
        XCTAssertTrue(valid.isValid)
        XCTAssertEqual(valid.agentsChecked, 1)
        XCTAssertEqual(valid.commandsChecked, 1)
        XCTAssertEqual(valid.skillsChecked, 1)

        let missing = ManifestValidator.validatePlugin(["name": "test-plugin", "source": "./plugins/test-plugin", "agents": ["agents/missing.md"], "skills": ["skills/missing"]], baseDir: root)
        XCTAssertFalse(missing.isValid)
        XCTAssertTrue(missing.errors.contains { $0.fileType == "agent" && $0.error == "missing_file" })
        XCTAssertTrue(missing.errors.contains { $0.fileType == "skill" && $0.error == "missing_skill_dir" })
    }

    func testValidateManifestPaths() throws {
        let root = temporaryDirectory()
        let plugin = root.appendingPathComponent("plugins/test-plugin", isDirectory: true)
        try FileManager.default.createDirectory(at: plugin.appendingPathComponent("agents", isDirectory: true), withIntermediateDirectories: true)
        try "agent".write(to: plugin.appendingPathComponent("agents/a.md"), atomically: true, encoding: .utf8)
        let manifest = root.appendingPathComponent("manifest.json")
        try #"{"plugins":[{"name":"test-plugin","source":"./plugins/test-plugin","agents":["agents/a.md"]}]}"#.write(to: manifest, atomically: true, encoding: .utf8)
        XCTAssertTrue(ManifestValidator.validateManifestPaths(manifestURL: manifest, baseDir: root).isValid)

        let missing = ManifestValidator.validateManifestPaths(manifestURL: root.appendingPathComponent("missing.json"), baseDir: root)
        XCTAssertFalse(missing.isValid)
        XCTAssertFalse(missing.manifestErrors.isEmpty)

        let empty = root.appendingPathComponent("empty.json")
        try #"{"plugins":[]}"#.write(to: empty, atomically: true, encoding: .utf8)
        XCTAssertTrue(ManifestValidator.validateManifestPaths(manifestURL: empty, baseDir: root).manifestErrors.contains { $0.contains("No plugins") })
    }

    func testUnregisteredPluginDirsAreErrors() throws {
        let root = temporaryDirectory()
        try FileManager.default.createDirectory(at: root.appendingPathComponent("plugins/registered", isDirectory: true), withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("plugins/orphan", isDirectory: true), withIntermediateDirectories: true)
        let manifest = root.appendingPathComponent("manifest.json")
        try #"{"plugins":[{"name":"registered","source":"./plugins/registered"}]}"#.write(to: manifest, atomically: true, encoding: .utf8)
        let result = ManifestValidator.validateManifestPaths(manifestURL: manifest, baseDir: root)
        XCTAssertFalse(result.isValid)
        XCTAssertEqual(result.unregisteredPluginDirs, ["plugins/orphan"])
    }

    func testFormatters() {
        var result = FullManifestResult(manifestPath: "test.json")
        result.pluginResults = [PluginValidationResult(pluginName: "p", pluginSource: "./plugins/p")]
        XCTAssertTrue(ManifestValidator.formatValidationText(result).lowercased().contains("validated successfully"))
        XCTAssertTrue(ManifestValidator.formatFixSuggestions(result).contains("No fixes needed"))
    }

    private func temporaryDirectory() -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try! FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        return url
    }
}

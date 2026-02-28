"""Tests for scripts/validate-manifests.py"""

import json
from pathlib import Path

import pytest
import validate_manifests as vm


# ── _resolve_path ──


class TestResolvePath:

    def test_relative_path(self, tmp_path):
        (tmp_path / "agents" / "foo.md").mkdir(parents=True, exist_ok=True)
        resolved, error = vm._resolve_path("agents/foo.md", tmp_path)
        assert error is None
        assert resolved == (tmp_path / "agents" / "foo.md").resolve()

    def test_dotslash_path(self, tmp_path):
        (tmp_path / "agents" / "foo.md").mkdir(parents=True, exist_ok=True)
        resolved, error = vm._resolve_path("./agents/foo.md", tmp_path)
        assert error is None
        assert resolved == (tmp_path / "agents" / "foo.md").resolve()

    def test_absolute_path_blocked(self, tmp_path):
        _, error = vm._resolve_path("/etc/passwd", tmp_path)
        assert error is not None
        assert "Absolute" in error

    def test_path_traversal_blocked(self, tmp_path):
        plugin_dir = tmp_path / "nested" / "dir"
        plugin_dir.mkdir(parents=True)
        _, error = vm._resolve_path("../../etc/passwd", plugin_dir)
        assert error is not None
        assert "traversal" in error.lower()


# ── _validate_plugin ──


class TestValidatePlugin:

    def test_valid_plugin(self, tmp_plugin_dir):
        plugin_dir = tmp_plugin_dir / "plugins" / "test-plugin"
        # Create agent, command, skill files
        (plugin_dir / "agents" / "helper.md").write_text("---\nname: helper\n---")
        (plugin_dir / "commands" / "run.md").write_text("---\ndescription: run\n---")
        (plugin_dir / "skills" / "test-skill" / "SKILL.md").write_text(
            "---\nname: test-skill\n---"
        )

        plugin = {
            "name": "test-plugin",
            "source": "./plugins/test-plugin",
            "agents": ["agents/helper.md"],
            "commands": ["commands/run.md"],
            "skills": ["skills/test-skill"],
        }
        result = vm._validate_plugin(plugin, tmp_plugin_dir)
        assert result.is_valid
        assert result.agents_checked == 1
        assert result.commands_checked == 1
        assert result.skills_checked == 1

    def test_missing_agent_file(self, tmp_plugin_dir):
        plugin = {
            "name": "test-plugin",
            "source": "./plugins/test-plugin",
            "agents": ["agents/missing.md"],
        }
        result = vm._validate_plugin(plugin, tmp_plugin_dir)
        assert not result.is_valid
        assert any(e.file_type == "agent" for e in result.errors)

    def test_missing_command_file(self, tmp_plugin_dir):
        plugin = {
            "name": "test-plugin",
            "source": "./plugins/test-plugin",
            "commands": ["commands/missing.md"],
        }
        result = vm._validate_plugin(plugin, tmp_plugin_dir)
        assert not result.is_valid
        assert any(e.file_type == "command" for e in result.errors)

    def test_missing_skill_dir(self, tmp_plugin_dir):
        plugin = {
            "name": "test-plugin",
            "source": "./plugins/test-plugin",
            "skills": ["skills/nonexistent"],
        }
        result = vm._validate_plugin(plugin, tmp_plugin_dir)
        assert not result.is_valid
        assert any(e.error == "missing_skill_dir" for e in result.errors)

    def test_missing_skill_md(self, tmp_plugin_dir):
        # Skill dir exists but no SKILL.md
        skill_dir = (
            tmp_plugin_dir / "plugins" / "test-plugin" / "skills" / "empty-skill"
        )
        skill_dir.mkdir(parents=True, exist_ok=True)

        plugin = {
            "name": "test-plugin",
            "source": "./plugins/test-plugin",
            "skills": ["skills/empty-skill"],
        }
        result = vm._validate_plugin(plugin, tmp_plugin_dir)
        assert not result.is_valid
        assert any(e.error == "missing_skill_md" for e in result.errors)

    def test_missing_source_dir(self, tmp_path):
        plugin = {
            "name": "nonexistent",
            "source": "./plugins/nonexistent",
        }
        result = vm._validate_plugin(plugin, tmp_path)
        assert not result.is_valid
        assert any(e.error == "missing_directory" for e in result.errors)

    def test_absolute_source_path(self, tmp_path):
        plugin = {
            "name": "bad",
            "source": "/etc/evil",
        }
        result = vm._validate_plugin(plugin, tmp_path)
        assert not result.is_valid
        assert any("absolute" in e.error for e in result.errors)


# ── validate_manifest_paths ──


class TestValidateManifestPaths:

    def test_valid_manifest(self, tmp_plugin_dir):
        plugin_dir = tmp_plugin_dir / "plugins" / "test-plugin"
        (plugin_dir / "agents" / "a.md").write_text("agent")
        manifest = {
            "plugins": [
                {
                    "name": "test-plugin",
                    "source": "./plugins/test-plugin",
                    "agents": ["agents/a.md"],
                }
            ]
        }
        manifest_path = tmp_plugin_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        result = vm.validate_manifest_paths(manifest_path, tmp_plugin_dir)
        assert result.is_valid

    def test_missing_manifest(self, tmp_path):
        result = vm.validate_manifest_paths(tmp_path / "nonexistent.json")
        assert not result.is_valid
        assert len(result.manifest_errors) > 0

    def test_invalid_json(self, tmp_path):
        bad_json = tmp_path / "bad.json"
        bad_json.write_text("{not valid json!!!")
        result = vm.validate_manifest_paths(bad_json)
        assert not result.is_valid
        assert any("JSON" in e for e in result.manifest_errors)

    def test_no_plugins(self, tmp_path):
        manifest_path = tmp_path / "empty.json"
        manifest_path.write_text(json.dumps({"plugins": []}))
        result = vm.validate_manifest_paths(manifest_path, tmp_path)
        assert not result.is_valid
        assert any("No plugins" in e for e in result.manifest_errors)


# ── FullValidationResult ──


class TestFullValidationResult:

    def test_is_valid_with_no_errors(self):
        result = vm.FullValidationResult(
            manifest_path="test.json",
            plugin_results=[
                vm.ValidationResult(
                    plugin_name="p", plugin_source="./plugins/p"
                )
            ],
        )
        assert result.is_valid is True

    def test_is_valid_with_manifest_errors(self):
        result = vm.FullValidationResult(
            manifest_path="test.json",
            manifest_errors=["Something is wrong"],
        )
        assert result.is_valid is False


# ── format_validation_text / format_fix_suggestions ──


class TestFormatOutput:

    def test_format_valid_result(self):
        result = vm.FullValidationResult(
            manifest_path="test.json",
            plugin_results=[
                vm.ValidationResult(
                    plugin_name="p", plugin_source="./plugins/p"
                )
            ],
        )
        text = vm.format_validation_text(result)
        assert "validated successfully" in text.lower()

    def test_format_fix_suggestions_valid(self):
        result = vm.FullValidationResult(
            manifest_path="test.json",
            plugin_results=[
                vm.ValidationResult(
                    plugin_name="p", plugin_source="./plugins/p"
                )
            ],
        )
        text = vm.format_fix_suggestions(result)
        assert "No fixes needed" in text

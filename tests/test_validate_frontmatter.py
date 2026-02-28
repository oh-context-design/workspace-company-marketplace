"""Tests for scripts/validate-frontmatter.py"""

import pytest
import validate_frontmatter as vf


# ── extract_frontmatter ──


class TestExtractFrontmatter:

    def test_extract_valid_frontmatter(self):
        content = "---\nname: my-agent\ndescription: A test\ncolor: blue\n---\n\nBody here"
        fm, end_line, body = vf.extract_frontmatter(content)
        assert fm is not None
        assert fm["name"] == "my-agent"
        assert fm["description"] == "A test"
        assert fm["color"] == "blue"
        assert "Body here" in body

    def test_extract_no_frontmatter(self):
        content = "Just some markdown\nwithout frontmatter"
        fm, end_line, body = vf.extract_frontmatter(content)
        assert fm is None
        assert end_line == 0
        assert body == content

    def test_extract_unclosed_frontmatter(self):
        content = "---\nname: my-agent\ndescription: A test\n"
        fm, end_line, body = vf.extract_frontmatter(content)
        assert fm is None
        assert end_line == 0
        assert body == content

    def test_extract_fallback_regex(self):
        content = "---\nname: my-agent\ndescription: Context: this has colons: everywhere\ncolor: blue\n---\n\nBody"
        fm, end_line, body = vf.extract_frontmatter(content)
        assert fm is not None
        assert fm["name"] == "my-agent"
        assert fm["color"] == "blue"


# ── validate_agent ──


class TestValidateAgent:

    def test_valid_agent(self, make_agent_md):
        content = make_agent_md(skills="test-skill", metadata="capabilities: [testing]")
        fm, _, body = vf.extract_frontmatter(content)
        errors, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", body)
        assert len(errors) == 0

    def test_agent_missing_required_fields(self):
        fm = {}
        errors, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", "")
        field_names = [e.field for e in errors]
        assert "name" in field_names
        assert "description" in field_names
        assert "color" in field_names
        assert "tools" in field_names

    def test_agent_invalid_color(self, make_agent_md):
        content = make_agent_md(color="rainbow")
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_agent(fm, "plugins/p/agents/a.md", body)
        assert any("color" in e.field for e in errors if e.field)

    def test_agent_invalid_name_format(self, make_agent_md):
        content = make_agent_md(name="My Agent")
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_agent(fm, "plugins/p/agents/a.md", body)
        assert any(e.field == "name" for e in errors)

    def test_agent_allowed_tools_instead_of_tools(self):
        fm = {"name": "test-agent", "description": "Test", "color": "blue",
              "allowed-tools": "Read, Write"}
        errors, _ = vf.validate_agent(fm, "plugins/p/agents/a.md", "")
        assert any("allowed-tools" in (e.field or "") for e in errors)

    def test_agent_missing_skills_warning(self, make_agent_md):
        content = make_agent_md()
        fm, _, body = vf.extract_frontmatter(content)
        _, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", body)
        assert any("skills" in (w.field or "") for w in warnings)

    def test_agent_missing_capabilities_warning(self, make_agent_md):
        content = make_agent_md()
        fm, _, body = vf.extract_frontmatter(content)
        _, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", body)
        assert any("capabilities" in (w.field or "") for w in warnings)

    def test_agent_non_standard_field_warning(self):
        fm = {"name": "test-agent", "description": "Test", "color": "blue",
              "tools": "Read", "foobar": "baz"}
        _, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", "")
        assert any("foobar" in (w.field or "") for w in warnings)

    def test_agent_metadata_field_at_top_level(self):
        fm = {"name": "test-agent", "description": "Test", "color": "blue",
              "tools": "Read", "capabilities": "[testing]"}
        _, warnings = vf.validate_agent(fm, "plugins/p/agents/a.md", "")
        assert any("capabilities" in (w.field or "") for w in warnings)


# ── validate_command ──


class TestValidateCommand:

    def test_valid_command(self, make_command_md):
        content = make_command_md()
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_command(fm, "plugins/p/commands/c.md", body)
        assert len(errors) == 0

    def test_command_missing_description(self):
        fm = {"allowed-tools": "Read"}
        errors, _ = vf.validate_command(fm, "plugins/p/commands/c.md",
                                        "$ARGUMENTS here")
        assert any(e.field == "description" for e in errors)

    def test_command_tools_instead_of_allowed_tools(self):
        fm = {"description": "Test command", "tools": "Read, Write"}
        errors, _ = vf.validate_command(fm, "plugins/p/commands/c.md",
                                        "$ARGUMENTS")
        assert any("tools" in (e.field or "") for e in errors)

    def test_command_missing_arguments_warning(self, make_command_md):
        content = "---\ndescription: Test command\nallowed-tools: Read\n---\n\nNo args placeholder"
        fm, _, body = vf.extract_frontmatter(content)
        _, warnings = vf.validate_command(fm, "plugins/p/commands/c.md", body)
        assert any("ARGUMENTS" in w.message for w in warnings)

    def test_command_table_routing_warning(self):
        fm = {"description": "Test", "allowed-tools": "Read"}
        body = "\n| Keyword | Action |\n| review | code-reviewer |\n"
        _, warnings = vf.validate_command(fm, "plugins/p/commands/c.md", body)
        assert any("routing" in w.message.lower() for w in warnings)


# ── validate_skill ──


class TestValidateSkill:

    def test_valid_skill(self, make_skill_md):
        content = make_skill_md()
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_skill(
            fm, "plugins/p/skills/test-skill/SKILL.md", body
        )
        assert len(errors) == 0

    def test_skill_missing_required_fields(self):
        fm = {}
        errors, _ = vf.validate_skill(
            fm, "plugins/p/skills/test-skill/SKILL.md", ""
        )
        field_names = [e.field for e in errors]
        assert "name" in field_names
        assert "description" in field_names

    def test_skill_invalid_name(self, make_skill_md):
        content = make_skill_md(name="My Skill")
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_skill(
            fm, "plugins/p/skills/my-skill/SKILL.md", body
        )
        assert any(e.field == "name" for e in errors)

    def test_skill_name_mismatch(self, make_skill_md):
        content = make_skill_md(name="other-skill")
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_skill(
            fm, "plugins/p/skills/test-skill/SKILL.md", body
        )
        assert any("match" in e.message.lower() for e in errors)

    def test_skill_arguments_in_body(self, make_skill_md):
        content = "---\nname: test-skill\ndescription: A test skill that does useful things\n---\n\nUse $ARGUMENTS here"
        fm, _, body = vf.extract_frontmatter(content)
        errors, _ = vf.validate_skill(
            fm, "plugins/p/skills/test-skill/SKILL.md", body
        )
        assert any("ARGUMENTS" in e.message for e in errors)

    def test_skill_short_description(self):
        fm = {"name": "test-skill", "description": "Short"}
        _, warnings = vf.validate_skill(
            fm, "plugins/p/skills/test-skill/SKILL.md", ""
        )
        assert any("short" in w.message.lower() for w in warnings)


# ── check_table_routing ──


class TestCheckTableRouting:

    def test_detects_keyword_action_table(self):
        content = "| Keyword | Action |\n| review | code-reviewer |"
        assert vf.check_table_routing(content) is True

    def test_no_table_routing(self):
        content = "This is regular markdown content."
        assert vf.check_table_routing(content) is False


# ── check_absolute_paths ──


class TestCheckAbsolutePaths:

    def test_detects_hardcoded_paths(self):
        content = "Read from /Users/foo/bar\nAlso /home/foo/baz"
        result = vf.check_absolute_paths(content)
        assert len(result) == 2

    def test_ignores_comments(self):
        content = "# /Users/foo/bar is a comment\n// /home/foo/baz also comment"
        result = vf.check_absolute_paths(content)
        assert len(result) == 0


# ── check_mcp_tools ──


class TestCheckMcpTools:

    def test_wrapper_agent_allowed(self):
        result = vf.check_mcp_tools("mcp__linear__get_issues", "focus-linear")
        assert result is None

    def test_non_wrapper_blocked(self):
        result = vf.check_mcp_tools("mcp__linear__get_issues", "my-agent")
        assert result is not None
        assert isinstance(result, str)


# ── get_file_type ──


class TestGetFileType:

    def test_agent_path(self):
        assert vf.get_file_type("plugins/foo/agents/bar.md") == "agent"

    def test_command_path(self):
        assert vf.get_file_type("plugins/foo/commands/bar.md") == "command"

    def test_skill_path(self):
        assert vf.get_file_type("plugins/foo/skills/bar/SKILL.md") == "skill"

    def test_unknown_path(self):
        assert vf.get_file_type("plugins/foo/other/bar.md") is None

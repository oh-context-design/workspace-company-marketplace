"""Shared fixtures for marketplace validation tests."""

import importlib.util
import sys
from pathlib import Path

import pytest


# ── Load validation scripts (hyphenated filenames require importlib) ──

def _load_module(name: str, script_path: Path):
    """Load a Python script as a module by path."""
    spec = importlib.util.spec_from_file_location(name, script_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = REPO_ROOT / "scripts"

validate_frontmatter = _load_module(
    "validate_frontmatter", SCRIPTS_DIR / "validate-frontmatter.py"
)
validate_manifests = _load_module(
    "validate_manifests", SCRIPTS_DIR / "validate-manifests.py"
)


# ── Fixtures ──


@pytest.fixture
def scripts_path():
    """Return the Path to the repo's scripts/ directory."""
    return SCRIPTS_DIR


@pytest.fixture
def tmp_plugin_dir(tmp_path):
    """Create a temp directory structure mirroring a plugin layout."""
    plugin = tmp_path / "plugins" / "test-plugin"
    (plugin / "agents").mkdir(parents=True)
    (plugin / "commands").mkdir(parents=True)
    (plugin / "skills" / "test-skill").mkdir(parents=True)
    return tmp_path


@pytest.fixture
def make_agent_md():
    """Generate agent markdown with YAML frontmatter."""

    def _make(name="test-agent", description="A test agent", color="blue",
              tools="Read, Write, Edit", **extra_fields):
        fields = {"name": name, "description": description, "color": color,
                  "tools": tools}
        fields.update(extra_fields)
        lines = ["---"]
        for k, v in fields.items():
            lines.append(f"{k}: {v}")
        lines.append("---")
        lines.append("")
        lines.append("# Agent body")
        return "\n".join(lines)

    return _make


@pytest.fixture
def make_command_md():
    """Generate command markdown with YAML frontmatter."""

    def _make(description="A test command", allowed_tools="Read, Write",
              **extra_fields):
        fields = {"description": description, "allowed-tools": allowed_tools}
        fields.update(extra_fields)
        lines = ["---"]
        for k, v in fields.items():
            lines.append(f"{k}: {v}")
        lines.append("---")
        lines.append("")
        lines.append("Run with $ARGUMENTS")
        return "\n".join(lines)

    return _make


@pytest.fixture
def make_skill_md():
    """Generate skill SKILL.md with YAML frontmatter."""

    def _make(name="test-skill",
              description="A test skill that does useful things for testing",
              **extra_fields):
        fields = {"name": name, "description": description}
        fields.update(extra_fields)
        lines = ["---"]
        for k, v in fields.items():
            lines.append(f"{k}: {v}")
        lines.append("---")
        lines.append("")
        lines.append("# Skill body")
        return "\n".join(lines)

    return _make


@pytest.fixture
def make_manifest():
    """Generate marketplace.json content dict."""

    def _make(plugins_list):
        return {"plugins": plugins_list}

    return _make

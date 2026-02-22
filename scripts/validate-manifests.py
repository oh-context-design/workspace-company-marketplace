#!/usr/bin/env python3
from __future__ import annotations

"""
Manifest Validation CLI

Standalone validator for checking manifest-to-filesystem integrity.
Designed for pre-commit hooks and CI/CD pipelines.

Usage:
    python3 scripts/validate-manifests.py           # Validate, human-readable
    python3 scripts/validate-manifests.py --json   # JSON output
    python3 scripts/validate-manifests.py --fix    # Show fix suggestions
    python3 scripts/validate-manifests.py --path /custom/manifest.json

Exit codes:
    0 - Valid (no errors)
    1 - Validation errors found
    2 - Manifest not found or unreadable
"""

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional


# ─── Inlined validation logic (from workspace plugin's validation.py) ───


@dataclass
class IntegrityError:
    """A single integrity error between manifest and filesystem."""
    plugin_name: str
    file_type: str  # 'agent', 'command', 'skill', 'hook'
    declared_path: str
    expected_path: str
    error: str  # 'missing_file', 'missing_skill_dir', 'missing_skill_md'

    def to_dict(self) -> dict[str, Any]:
        return {
            'plugin_name': self.plugin_name,
            'file_type': self.file_type,
            'declared_path': self.declared_path,
            'expected_path': self.expected_path,
            'error': self.error,
        }


@dataclass
class ValidationResult:
    """Validation result for a single plugin."""
    plugin_name: str
    plugin_source: str
    errors: list[IntegrityError] = field(default_factory=list)
    agents_checked: int = 0
    commands_checked: int = 0
    skills_checked: int = 0
    hooks_checked: int = 0

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    @property
    def total_checked(self) -> int:
        return (
            self.agents_checked +
            self.commands_checked +
            self.skills_checked +
            self.hooks_checked
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            'plugin_name': self.plugin_name,
            'plugin_source': self.plugin_source,
            'is_valid': self.is_valid,
            'errors': [e.to_dict() for e in self.errors],
            'agents_checked': self.agents_checked,
            'commands_checked': self.commands_checked,
            'skills_checked': self.skills_checked,
            'hooks_checked': self.hooks_checked,
            'total_checked': self.total_checked,
        }


@dataclass
class FullValidationResult:
    """Validation result for entire manifest."""
    manifest_path: str
    plugin_results: list[ValidationResult] = field(default_factory=list)
    manifest_errors: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        if self.manifest_errors:
            return False
        return all(r.is_valid for r in self.plugin_results)

    @property
    def total_errors(self) -> int:
        return len(self.manifest_errors) + sum(
            len(r.errors) for r in self.plugin_results
        )

    @property
    def total_checked(self) -> int:
        return sum(r.total_checked for r in self.plugin_results)

    def to_dict(self) -> dict[str, Any]:
        return {
            'manifest_path': self.manifest_path,
            'is_valid': self.is_valid,
            'total_errors': self.total_errors,
            'total_checked': self.total_checked,
            'manifest_errors': self.manifest_errors,
            'plugin_results': [r.to_dict() for r in self.plugin_results],
        }


def _resolve_path(
    declared_path: str,
    plugin_dir: Path
) -> tuple[Path, str | None]:
    """Resolve a declared path relative to plugin directory safely."""
    if declared_path.startswith('/'):
        return Path(), f"Absolute paths not allowed: {declared_path}"

    clean_path = declared_path[2:] if declared_path.startswith('./') else declared_path
    resolved = (plugin_dir / clean_path).resolve()

    try:
        resolved.relative_to(plugin_dir.resolve())
    except ValueError:
        return Path(), f"Path traversal detected: {declared_path}"

    return resolved, None


def _validate_plugin(plugin: dict[str, Any], base_dir: Path) -> ValidationResult:
    """Validate a single plugin's declared paths."""
    name = plugin.get('name', 'unknown')
    source = plugin.get('source', '')

    result = ValidationResult(plugin_name=name, plugin_source=source)

    if source.startswith('/'):
        result.errors.append(IntegrityError(
            plugin_name=name, file_type='source',
            declared_path=source, expected_path='(absolute paths not allowed)',
            error='absolute_path_not_allowed',
        ))
        return result

    clean_source = source[2:] if source.startswith('./') else source
    plugin_dir = (base_dir / clean_source).resolve()

    try:
        plugin_dir.relative_to(base_dir.resolve())
    except ValueError:
        result.errors.append(IntegrityError(
            plugin_name=name, file_type='source',
            declared_path=source, expected_path='(path traversal detected)',
            error='path_traversal_detected',
        ))
        return result

    if not plugin_dir.exists():
        result.errors.append(IntegrityError(
            plugin_name=name, file_type='source',
            declared_path=source, expected_path=str(plugin_dir),
            error='missing_directory',
        ))
        return result

    # Validate agents
    for agent_path in plugin.get('agents', []):
        result.agents_checked += 1
        full_path, path_error = _resolve_path(agent_path, plugin_dir)
        if path_error:
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='agent',
                declared_path=agent_path, expected_path='(invalid path)',
                error=path_error,
            ))
        elif not full_path.exists():
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='agent',
                declared_path=agent_path, expected_path=str(full_path),
                error='missing_file',
            ))

    # Validate commands
    for command_path in plugin.get('commands', []):
        result.commands_checked += 1
        full_path, path_error = _resolve_path(command_path, plugin_dir)
        if path_error:
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='command',
                declared_path=command_path, expected_path='(invalid path)',
                error=path_error,
            ))
        elif not full_path.exists():
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='command',
                declared_path=command_path, expected_path=str(full_path),
                error='missing_file',
            ))

    # Validate skills (directory + SKILL.md)
    for skill_path in plugin.get('skills', []):
        result.skills_checked += 1
        skill_dir, path_error = _resolve_path(skill_path, plugin_dir)

        if path_error:
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='skill',
                declared_path=skill_path, expected_path='(invalid path)',
                error=path_error,
            ))
        elif not skill_dir.exists():
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='skill',
                declared_path=skill_path, expected_path=str(skill_dir),
                error='missing_skill_dir',
            ))
        elif not skill_dir.is_dir():
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='skill',
                declared_path=skill_path, expected_path=str(skill_dir),
                error='not_a_directory',
            ))
        else:
            skill_md = skill_dir / 'SKILL.md'
            if not skill_md.exists():
                result.errors.append(IntegrityError(
                    plugin_name=name, file_type='skill',
                    declared_path=skill_path, expected_path=str(skill_md),
                    error='missing_skill_md',
                ))

    # Validate hooks
    hooks_path = plugin.get('hooks')
    if hooks_path:
        result.hooks_checked += 1
        full_path, path_error = _resolve_path(hooks_path, plugin_dir)
        if path_error:
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='hook',
                declared_path=hooks_path, expected_path='(invalid path)',
                error=path_error,
            ))
        elif not full_path.exists():
            result.errors.append(IntegrityError(
                plugin_name=name, file_type='hook',
                declared_path=hooks_path, expected_path=str(full_path),
                error='missing_file',
            ))

    return result


def validate_manifest_paths(
    manifest_path: Path,
    base_dir: Optional[Path] = None
) -> FullValidationResult:
    """Validate that all paths declared in a manifest exist on the filesystem."""
    result = FullValidationResult(manifest_path=str(manifest_path))

    if not manifest_path.exists():
        result.manifest_errors.append(f"Manifest not found: {manifest_path}")
        return result

    if base_dir is None:
        base_dir = manifest_path.parent

    try:
        with open(manifest_path, encoding='utf-8') as f:
            manifest = json.load(f)
    except json.JSONDecodeError as e:
        result.manifest_errors.append(f"Invalid JSON: {e}")
        return result
    except Exception as e:
        result.manifest_errors.append(f"Error reading manifest: {e}")
        return result

    plugins = manifest.get('plugins', [])
    if not plugins:
        result.manifest_errors.append("No plugins found in manifest")
        return result

    for plugin in plugins:
        plugin_result = _validate_plugin(plugin, base_dir)
        result.plugin_results.append(plugin_result)

    return result


def validate_root_manifest() -> FullValidationResult:
    """Validate the root manifest, resolving paths relative to repo root."""
    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent

    manifest_path = repo_root / '.claude-plugin' / 'marketplace.json'

    if not manifest_path.exists():
        result = FullValidationResult(manifest_path='not found')
        result.manifest_errors.append(
            f"Marketplace manifest not found at {manifest_path}"
        )
        return result

    return validate_manifest_paths(manifest_path, base_dir=repo_root)


def format_validation_text(result: FullValidationResult) -> str:
    """Format validation result as human-readable text."""
    lines = []

    lines.append("=" * 50)
    lines.append("MANIFEST VALIDATION")
    lines.append("=" * 50)
    lines.append(f"Manifest: {result.manifest_path}")
    lines.append(f"Total items checked: {result.total_checked}")
    lines.append("")

    if result.manifest_errors:
        lines.append("Manifest Errors:")
        for error in result.manifest_errors:
            lines.append(f"  x {error}")
        lines.append("")

    valid_plugins = []
    invalid_plugins = []

    for pr in result.plugin_results:
        if pr.is_valid:
            valid_plugins.append(pr)
        else:
            invalid_plugins.append(pr)

    if invalid_plugins:
        lines.append("Plugins with Errors:")
        for pr in invalid_plugins:
            lines.append(f"  x {pr.plugin_name} ({len(pr.errors)} errors)")
            for integrity_error in pr.errors:
                lines.append(f"    - {integrity_error.file_type}: {integrity_error.declared_path}")
                lines.append(f"      Error: {integrity_error.error}")
                lines.append(f"      Expected: {integrity_error.expected_path}")
        lines.append("")

    if valid_plugins:
        lines.append("Valid Plugins:")
        for pr in valid_plugins:
            lines.append(f"  + {pr.plugin_name} ({pr.total_checked} items)")
        lines.append("")

    lines.append("-" * 50)
    if result.is_valid:
        lines.append("+ All manifest paths validated successfully")
    else:
        lines.append(f"x Found {result.total_errors} errors")
    lines.append("")

    return "\n".join(lines)


def format_fix_suggestions(result: FullValidationResult) -> str:
    """Generate fix suggestions for validation errors."""
    if result.is_valid:
        return "No fixes needed - all paths are valid."

    lines = []
    lines.append("=" * 50)
    lines.append("FIX SUGGESTIONS")
    lines.append("=" * 50)
    lines.append("")
    lines.append("These are suggestions only. Review before applying.")
    lines.append("")

    for pr in result.plugin_results:
        if pr.is_valid:
            continue

        lines.append(f"Plugin: {pr.plugin_name}")
        lines.append("-" * 30)

        for error in pr.errors:
            if error.error == 'missing_file':
                lines.append(f"  Option 1: Create missing {error.file_type}")
                lines.append(f"    touch {error.expected_path}")
                lines.append("")
                lines.append(f"  Option 2: Remove from manifest")
                lines.append(f"    Remove '{error.declared_path}' from {error.file_type}s array")
                lines.append("")
            elif error.error == 'missing_skill_dir':
                lines.append(f"  Option 1: Create skill directory")
                lines.append(f"    mkdir -p {error.expected_path}")
                lines.append(f"    touch {error.expected_path}/SKILL.md")
                lines.append("")
                lines.append(f"  Option 2: Remove from manifest")
                lines.append(f"    Remove '{error.declared_path}' from skills array")
                lines.append("")
            elif error.error == 'missing_skill_md':
                lines.append(f"  Create SKILL.md:")
                lines.append(f"    touch {error.expected_path}")
                lines.append("")
            elif error.error == 'missing_directory':
                lines.append(f"  Plugin source directory missing:")
                lines.append(f"    mkdir -p {error.expected_path}")
                lines.append("")

    return "\n".join(lines)


# ─── CLI entry point ───


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Validate manifest-to-filesystem integrity',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exit codes:
  0  Valid (no errors)
  1  Validation errors found
  2  Manifest not found or unreadable

Examples:
  python3 scripts/validate-manifests.py
  python3 scripts/validate-manifests.py --json
  python3 scripts/validate-manifests.py --fix
  python3 scripts/validate-manifests.py --path .claude-plugin/marketplace.json
        """
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help='Show fix suggestions for errors (suggestions only, no auto-fix)'
    )
    parser.add_argument(
        '--path',
        type=str,
        help='Path to manifest file (defaults to auto-detect root manifest)'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress output, only return exit code'
    )

    args = parser.parse_args()

    # Validate manifest
    if args.path:
        manifest_path = Path(args.path).resolve()
        if not manifest_path.exists():
            if not args.quiet:
                if args.json:
                    print(json.dumps({
                        'error': f'Manifest not found: {manifest_path}',
                        'is_valid': False,
                    }, indent=2))
                else:
                    print(f"Error: Manifest not found: {manifest_path}")
            return 2

        result = validate_manifest_paths(manifest_path)
    else:
        result = validate_root_manifest()
        if result.manifest_errors and 'not found' in result.manifest_path:
            if not args.quiet:
                if args.json:
                    print(json.dumps({
                        'error': 'Root manifest not found',
                        'is_valid': False,
                    }, indent=2))
                else:
                    print("Error: Root manifest not found")
                    print("  Expected: .claude-plugin/marketplace.json")
            return 2

    # Output results
    if args.quiet:
        return 0 if result.is_valid else 1

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(format_validation_text(result))

        if args.fix and not result.is_valid:
            print()
            print(format_fix_suggestions(result))

    return 0 if result.is_valid else 1


if __name__ == '__main__':
    sys.exit(main())

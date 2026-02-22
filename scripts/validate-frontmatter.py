#!/usr/bin/env python3
"""
Frontmatter Validation CLI

Validates YAML frontmatter in plugin markdown files against documented specs.
Mirrors the validation logic from workspace-handoff agent.
Designed for CI/CD pipelines and pre-commit hooks.

Usage:
    python3 scripts/validate-frontmatter.py           # Validate all plugins
    python3 scripts/validate-frontmatter.py --json    # JSON output
    python3 scripts/validate-frontmatter.py --changed # Only changed files (git)
    python3 scripts/validate-frontmatter.py --strict  # Treat warnings as errors

Exit codes:
    0 - Valid (no errors)
    1 - Validation errors found
    2 - No files to validate

Reference:
    docs/reference/agent-frontmatter.md
    docs/reference/command-frontmatter.md
    docs/reference/skill-frontmatter.md
    plugins/workspace/agents/handoff.md (Verification Checklist)
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, NamedTuple, Optional, Tuple

try:
    import yaml
except ImportError:
    print("Error: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(2)


# Valid colors per agent-frontmatter.md
VALID_COLORS = frozenset([
    'blue', 'green', 'yellow', 'red', 'orange', 'purple', 'cyan', 'pink'
])

# Known fields per file type (capabilities goes in metadata)
AGENT_FIELDS = frozenset([
    'name', 'description', 'color', 'tools', 'skills', 'context', 'hooks', 'model', 'metadata'
])
COMMAND_FIELDS = frozenset([
    'name', 'description', 'allowed-tools', 'argument-hint', 'skills', 'metadata'
])
SKILL_FIELDS = frozenset([
    'name', 'description', 'allowed-tools', 'context', 'agent', 'user-invocable', 'metadata'
])

# Fields that belong in metadata block
METADATA_FIELDS = frozenset(['capabilities', 'license'])

# MCP wrapper agents - only these should have direct MCP tool access
MCP_WRAPPER_AGENTS = frozenset([
    'focus-linear', 'life-notion', 'life-calendar', 'life-kroger',
    'life-instacart', 'company-sprint'  # Exception per delegation-map.json
])

# File type patterns
AGENT_PATTERN = re.compile(r'plugins/[^/]+/agents/[^/]+\.md$')
COMMAND_PATTERN = re.compile(r'plugins/[^/]+/commands/[^/]+\.md$')
SKILL_PATTERN = re.compile(r'plugins/[^/]+/skills/([^/]+)/SKILL\.md$')


class ValidationIssue(NamedTuple):
    file: str
    line: int
    message: str
    field: Optional[str] = None
    severity: str = 'error'  # 'error' or 'warning'


class ValidationResult(NamedTuple):
    errors: List['ValidationIssue']
    warnings: List['ValidationIssue']
    files_checked: int

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def to_dict(self) -> dict:
        return {
            'is_valid': self.is_valid,
            'files_checked': self.files_checked,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'errors': [
                {
                    'file': e.file,
                    'line': e.line,
                    'message': e.message,
                    'field': e.field,
                    'severity': e.severity,
                }
                for e in self.errors
            ],
            'warnings': [
                {
                    'file': w.file,
                    'line': w.line,
                    'message': w.message,
                    'field': w.field,
                    'severity': w.severity,
                }
                for w in self.warnings
            ]
        }


def extract_frontmatter(content: str) -> Tuple[Optional[dict], int, str]:
    """Extract YAML frontmatter from markdown content.

    Returns:
        tuple of (parsed frontmatter dict or None, line number where frontmatter ends, body content)
    """
    if not content.startswith('---'):
        return None, 0, content

    # Find closing ---
    lines = content.split('\n')
    end_line = None
    for i, line in enumerate(lines[1:], start=2):
        if line.strip() == '---':
            end_line = i
            break

    if end_line is None:
        return None, 0, content

    frontmatter_text = '\n'.join(lines[1:end_line-1])
    body = '\n'.join(lines[end_line:])

    # Try standard YAML parsing first
    try:
        parsed = yaml.safe_load(frontmatter_text)
        if isinstance(parsed, dict):
            return parsed, end_line, body
    except yaml.YAMLError:
        pass

    # Fallback: regex-based extraction for files with unquoted colons in values
    # This handles cases like "description: ... Context: ..." which break YAML
    parsed = {}
    for line in lines[1:end_line-1]:
        # Match top-level keys (not indented)
        match = re.match(r'^([a-z][a-z0-9-]*)\s*:\s*(.*)$', line, re.IGNORECASE)
        if match:
            key = match.group(1).lower()
            value = match.group(2).strip()
            # Handle multi-line or array values
            if value.startswith('[') or value.startswith('-') or not value:
                # Skip complex values, just note the key exists
                parsed[key] = value if value else True
            else:
                parsed[key] = value

    return parsed if parsed else None, end_line, body


def is_array(value) -> bool:
    """Check if value is an array (list) instead of comma-separated string."""
    return isinstance(value, list)


def validate_lowercase_hyphenated(value: str) -> bool:
    """Validate name is lowercase-hyphenated."""
    if not isinstance(value, str):
        return False
    return bool(re.match(r'^[a-z][a-z0-9-]*$', value))


def check_table_routing(content: str) -> bool:
    """Check if content contains table-based routing (anti-pattern)."""
    # Look for patterns like "| Keyword | Action |" or "| Trigger | Agent |"
    table_routing_patterns = [
        r'\|\s*(Keyword|Trigger|Command|Input|First Word)\s*\|\s*(Action|Agent|Route)',
        r'\|\s*\w+\s*\|\s*(code-reviewer|engineer|architect)',
    ]
    for pattern in table_routing_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False


def check_absolute_paths(content: str) -> List[int]:
    """Check for absolute paths instead of ${CLAUDE_PLUGIN_ROOT}."""
    lines_with_absolute = []
    for i, line in enumerate(content.split('\n'), start=1):
        # Look for hardcoded paths like /Users/, ~/.claude/plugins/, etc.
        if re.search(r'(/Users/|/home/|~/.claude/plugins/)', line):
            # Exclude comments explaining paths
            if not line.strip().startswith('#') and not line.strip().startswith('//'):
                lines_with_absolute.append(i)
    return lines_with_absolute


def check_mcp_tools(tools_str: str, agent_name: str) -> Optional[str]:
    """Check if non-wrapper agent has MCP tools (anti-pattern)."""
    if not tools_str:
        return None

    # Check if agent is a wrapper
    if agent_name in MCP_WRAPPER_AGENTS:
        return None

    # Look for MCP tool patterns
    mcp_patterns = [
        (r'mcp__.*linear', 'Linear MCP - delegate to focus-linear agent'),
        (r'mcp__.*[Nn]otion', 'Notion MCP - delegate to life-notion agent'),
        (r'mcp__.*calendar', 'Calendar MCP - delegate to life-calendar agent'),
        (r'mcp__.*kroger', 'Kroger MCP - delegate to life-kroger agent'),
    ]

    for pattern, message in mcp_patterns:
        if re.search(pattern, tools_str, re.IGNORECASE):
            return message

    return None


def validate_agent(frontmatter: dict, file_path: str, body: str) -> Tuple[List[ValidationIssue], List[ValidationIssue]]:
    """Validate agent frontmatter per agent-frontmatter.md and handoff checklist."""
    errors = []
    warnings = []

    # ERROR if agent uses 'allowed-tools' instead of 'tools'
    if 'allowed-tools' in frontmatter and 'tools' not in frontmatter:
        errors.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Agents must use 'tools', not 'allowed-tools'",
            field='allowed-tools'
        ))

    # Required fields per handoff checklist
    required = ['name', 'description', 'color', 'tools']
    for field in required:
        if field not in frontmatter:
            errors.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Missing required field '{field}'",
                field=field
            ))

    # Recommended fields (warnings per handoff)
    # Note: capabilities now lives in metadata.capabilities
    if 'skills' not in frontmatter:
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Missing recommended field 'skills' - agents should have skills for discoverability",
            field='skills',
            severity='warning'
        ))

    # Check for capabilities in metadata block
    metadata = frontmatter.get('metadata', {})
    if not isinstance(metadata, dict):
        metadata = {}
    if 'capabilities' not in metadata:
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Missing 'metadata.capabilities' - agents should have capabilities for discoverability",
            field='metadata.capabilities',
            severity='warning'
        ))

    # Validate name format
    if 'name' in frontmatter:
        if not validate_lowercase_hyphenated(frontmatter['name']):
            errors.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Field 'name' must be lowercase-hyphenated (got: {frontmatter['name']})",
                field='name'
            ))

    # Validate color
    if 'color' in frontmatter:
        if frontmatter['color'] not in VALID_COLORS:
            errors.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Invalid color '{frontmatter['color']}'. Valid: {', '.join(sorted(VALID_COLORS))}",
                field='color'
            ))

    # Arrays are valid YAML - Claude accepts both formats
    # No validation needed for array vs comma-separated

    # MCP delegation check
    agent_name = frontmatter.get('name', '')
    tools_str = frontmatter.get('tools', '')
    if isinstance(tools_str, str):
        mcp_issue = check_mcp_tools(tools_str, agent_name)
        if mcp_issue:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Non-wrapper agent has MCP tools: {mcp_issue}",
                field='tools',
                severity='warning'
            ))

    # Check for absolute paths in body
    abs_path_lines = check_absolute_paths(body)
    for line_num in abs_path_lines[:3]:  # Limit to first 3
        warnings.append(ValidationIssue(
            file=file_path,
            line=line_num,
            message="Use ${CLAUDE_PLUGIN_ROOT} instead of absolute paths",
            field=None,
            severity='warning'
        ))

    # Check for fields that should be in metadata or are non-standard
    for field in frontmatter.keys():
        if field in METADATA_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Field '{field}' should be under 'metadata:' block",
                field=field,
                severity='warning'
            ))
        elif field not in AGENT_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Non-standard field '{field}' - wrap in 'metadata:' block",
                field=field,
                severity='warning'
            ))

    return errors, warnings


def validate_command(frontmatter: dict, file_path: str, body: str) -> Tuple[List[ValidationIssue], List[ValidationIssue]]:
    """Validate command frontmatter per command-frontmatter.md spec."""
    errors = []
    warnings = []

    # ERROR if command uses 'tools' instead of 'allowed-tools'
    if 'tools' in frontmatter and 'allowed-tools' not in frontmatter:
        errors.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Commands must use 'allowed-tools', not 'tools'",
            field='tools'
        ))

    # Required field: description
    if 'description' not in frontmatter:
        errors.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Missing required field 'description'",
            field='description'
        ))

    # tools is recommended but not strictly required (some commands use allowed-tools or just route)
    if 'tools' not in frontmatter and 'allowed-tools' not in frontmatter:
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Missing 'tools' field - commands typically need tools to execute",
            field='tools',
            severity='warning'
        ))

    # Arrays are valid YAML - Claude accepts both formats
    # No validation needed for array vs comma-separated

    # Check for $ARGUMENTS placeholder in commands
    if '$ARGUMENTS' not in body:
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Command missing $ARGUMENTS placeholder - commands should include user input",
            field=None,
            severity='warning'
        ))

    # Check for table-based routing (anti-pattern per handoff)
    if check_table_routing(body):
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Table-based routing detected - use natural language bullet points instead",
            field=None,
            severity='warning'
        ))

    # Check for fields that should be in metadata or are non-standard
    for field in frontmatter.keys():
        if field in METADATA_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Field '{field}' should be under 'metadata:' block",
                field=field,
                severity='warning'
            ))
        elif field not in COMMAND_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Non-standard field '{field}' - wrap in 'metadata:' block",
                field=field,
                severity='warning'
            ))

    return errors, warnings


def validate_skill(frontmatter: dict, file_path: str, body: str) -> Tuple[List[ValidationIssue], List[ValidationIssue]]:
    """Validate skill frontmatter per skill-frontmatter.md spec."""
    errors = []
    warnings = []

    # ERROR if skill uses 'tools' instead of 'allowed-tools'
    if 'tools' in frontmatter and 'allowed-tools' not in frontmatter:
        errors.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Skills must use 'allowed-tools', not 'tools'",
            field='tools'
        ))

    # Required fields
    required = ['name', 'description']
    for field in required:
        if field not in frontmatter:
            errors.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Missing required field '{field}'",
                field=field
            ))

    # Validate name format
    if 'name' in frontmatter:
        if not validate_lowercase_hyphenated(frontmatter['name']):
            errors.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Field 'name' must be lowercase-hyphenated (got: {frontmatter['name']})",
                field='name'
            ))

        # Skill name should match directory name
        match = SKILL_PATTERN.search(file_path.replace('\\', '/'))
        if match:
            dir_name = match.group(1)
            if frontmatter['name'] != dir_name:
                errors.append(ValidationIssue(
                    file=file_path,
                    line=1,
                    message=f"Skill name '{frontmatter['name']}' must match directory name '{dir_name}'",
                    field='name'
                ))

    # Arrays are valid YAML - Claude accepts both formats
    # No validation needed for array vs comma-separated

    # Check description explains WHAT + WHEN (per handoff)
    desc = frontmatter.get('description', '')
    if desc and len(desc) < 20:
        warnings.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Description too short - should explain WHAT the skill provides AND WHEN to use it",
            field='description',
            severity='warning'
        ))

    # Check for $ARGUMENTS in skills (anti-pattern)
    if '$ARGUMENTS' in body:
        errors.append(ValidationIssue(
            file=file_path,
            line=1,
            message="Skills cannot use $ARGUMENTS - they receive no user input. Use commands or agents instead.",
            field=None
        ))

    # Check for fields that should be in metadata or are non-standard
    for field in frontmatter.keys():
        if field in METADATA_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Field '{field}' should be under 'metadata:' block",
                field=field,
                severity='warning'
            ))
        elif field not in SKILL_FIELDS:
            warnings.append(ValidationIssue(
                file=file_path,
                line=1,
                message=f"Non-standard field '{field}' - wrap in 'metadata:' block",
                field=field,
                severity='warning'
            ))

    return errors, warnings


def get_file_type(file_path: str) -> Optional[str]:
    """Determine file type from path."""
    # Normalize path separators
    normalized = file_path.replace('\\', '/')

    if AGENT_PATTERN.search(normalized):
        return 'agent'
    elif COMMAND_PATTERN.search(normalized):
        return 'command'
    elif SKILL_PATTERN.search(normalized):
        return 'skill'
    return None


def validate_file(file_path: Path) -> Tuple[List[ValidationIssue], List[ValidationIssue]]:
    """Validate a single file's frontmatter and content."""
    errors = []
    warnings = []

    # Determine file type
    file_type = get_file_type(str(file_path))
    if file_type is None:
        return [], []  # Not a validatable file

    # Read file
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return [ValidationIssue(
            file=str(file_path),
            line=1,
            message=f"Cannot read file: {e}",
            field=None
        )], []

    # Extract frontmatter
    frontmatter, end_line, body = extract_frontmatter(content)

    if frontmatter is None:
        errors.append(ValidationIssue(
            file=str(file_path),
            line=1,
            message="Missing or invalid YAML frontmatter",
            field=None
        ))
        return errors, warnings

    # Validate based on file type
    if file_type == 'agent':
        e, w = validate_agent(frontmatter, str(file_path), body)
        errors.extend(e)
        warnings.extend(w)
    elif file_type == 'command':
        e, w = validate_command(frontmatter, str(file_path), body)
        errors.extend(e)
        warnings.extend(w)
    elif file_type == 'skill':
        e, w = validate_skill(frontmatter, str(file_path), body)
        errors.extend(e)
        warnings.extend(w)

    return errors, warnings


def find_plugin_files(plugins_dir: Path) -> List[Path]:
    """Find all validatable markdown files in plugins directory."""
    files = []

    for plugin_dir in plugins_dir.iterdir():
        if not plugin_dir.is_dir():
            continue

        # Agents
        agents_dir = plugin_dir / 'agents'
        if agents_dir.exists():
            files.extend(agents_dir.glob('*.md'))

        # Commands
        commands_dir = plugin_dir / 'commands'
        if commands_dir.exists():
            files.extend(commands_dir.glob('*.md'))

        # Skills (SKILL.md only, not references)
        skills_dir = plugin_dir / 'skills'
        if skills_dir.exists():
            for skill_dir in skills_dir.iterdir():
                if skill_dir.is_dir():
                    skill_file = skill_dir / 'SKILL.md'
                    if skill_file.exists():
                        files.append(skill_file)

    return files


def get_changed_files() -> List[Path]:
    """Get list of changed markdown files from git."""
    try:
        # Get files changed in PR (compared to base branch)
        result = subprocess.run(
            ['git', 'diff', '--name-only', '--diff-filter=ACMR', 'origin/main...HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        files = result.stdout.strip().split('\n')
    except subprocess.CalledProcessError:
        # Fallback: get uncommitted changes
        try:
            result = subprocess.run(
                ['git', 'diff', '--name-only', '--diff-filter=ACMR', 'HEAD'],
                capture_output=True,
                text=True,
                check=True
            )
            files = result.stdout.strip().split('\n')
        except subprocess.CalledProcessError:
            return []

    # Filter to markdown files in plugins
    return [
        Path(f) for f in files
        if f.endswith('.md') and f.startswith('plugins/')
    ]


def format_issues_text(result: ValidationResult, show_warnings: bool = True) -> str:
    """Format validation result as human-readable text."""
    lines = []

    if result.is_valid and not result.warnings:
        lines.append(f"✓ All {result.files_checked} files valid")
    elif result.is_valid and result.warnings:
        lines.append(f"✓ {result.files_checked} files valid with {len(result.warnings)} warning(s)")
    else:
        lines.append(f"✗ Found {len(result.errors)} error(s) in {result.files_checked} files")

    # Show errors
    if result.errors:
        lines.append("")
        lines.append("ERRORS:")

        # Group by file
        by_file = {}  # type: Dict[str, List[ValidationIssue]]
        for issue in result.errors:
            if issue.file not in by_file:
                by_file[issue.file] = []
            by_file[issue.file].append(issue)

        for file_path, file_issues in sorted(by_file.items()):
            lines.append(f"  {file_path}:")
            for issue in file_issues:
                field_info = f" [{issue.field}]" if issue.field else ""
                lines.append(f"    Line {issue.line}{field_info}: {issue.message}")
            lines.append("")

    # Show warnings
    if show_warnings and result.warnings:
        lines.append("")
        lines.append("WARNINGS:")

        by_file = {}  # type: Dict[str, List[ValidationIssue]]
        for issue in result.warnings:
            if issue.file not in by_file:
                by_file[issue.file] = []
            by_file[issue.file].append(issue)

        for file_path, file_issues in sorted(by_file.items()):
            lines.append(f"  {file_path}:")
            for issue in file_issues:
                field_info = f" [{issue.field}]" if issue.field else ""
                lines.append(f"    Line {issue.line}{field_info}: {issue.message}")
            lines.append("")

    return '\n'.join(lines)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Validate YAML frontmatter in plugin markdown files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exit codes:
  0  Valid (no errors)
  1  Validation errors found
  2  No files to validate

Examples:
  python3 scripts/validate-frontmatter.py
  python3 scripts/validate-frontmatter.py --json
  python3 scripts/validate-frontmatter.py --changed
  python3 scripts/validate-frontmatter.py --strict  # warnings become errors
        """
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    parser.add_argument(
        '--changed',
        action='store_true',
        help='Only validate files changed in git'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Treat warnings as errors'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress output, only return exit code'
    )
    parser.add_argument(
        '--no-warnings',
        action='store_true',
        help='Suppress warning output (still show errors)'
    )

    args = parser.parse_args()

    # Find repository root
    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent
    plugins_dir = repo_root / 'plugins'

    if not plugins_dir.exists():
        if not args.quiet:
            print("Error: plugins directory not found")
        return 2

    # Get files to validate
    if args.changed:
        files = get_changed_files()
        # Resolve relative to repo root
        files = [repo_root / f for f in files if (repo_root / f).exists()]
    else:
        files = find_plugin_files(plugins_dir)

    if not files:
        if not args.quiet:
            if args.json:
                print(json.dumps({'is_valid': True, 'files_checked': 0, 'errors': [], 'warnings': []}))
            else:
                print("No files to validate")
        return 0

    # Validate all files
    all_errors = []  # type: List[ValidationIssue]
    all_warnings = []  # type: List[ValidationIssue]

    for file_path in files:
        errors, warnings = validate_file(file_path)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    # In strict mode, promote warnings to errors
    if args.strict:
        all_errors.extend(all_warnings)
        all_warnings = []

    result = ValidationResult(
        errors=all_errors,
        warnings=all_warnings,
        files_checked=len(files)
    )

    # Output results
    if not args.quiet:
        if args.json:
            print(json.dumps(result.to_dict(), indent=2))
        else:
            print(format_issues_text(result, show_warnings=not args.no_warnings))

    return 0 if result.is_valid else 1


if __name__ == '__main__':
    sys.exit(main())

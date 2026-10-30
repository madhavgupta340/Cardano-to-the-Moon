"""Install pinned, bundled skills offline using only the Python standard library."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import zipfile

BASE = Path(__file__).resolve().parent
PROJECT = BASE.parent


def digest(data):
    return hashlib.sha256(data).hexdigest()


def archive_files(source):
    archive_path = BASE / source['archive']
    data = archive_path.read_bytes()
    if digest(data) != source['sha256']:
        raise ValueError(f"Archive checksum mismatch: {archive_path.name}")
    files = {}
    seen = set()
    with zipfile.ZipFile(archive_path) as archive:
        for entry in archive.infolist():
            parts = PurePosixPath(entry.filename).parts
            if len(parts) < 2 or entry.is_dir():
                continue
            relative = PurePosixPath(*parts[1:])
            if relative.is_absolute() or any(p in ('.', '..') or ':' in p or '\\' in p for p in parts):
                raise ValueError('Unsafe archive path')
            if stat.S_ISLNK(entry.external_attr >> 16):
                # Upstream's Unix discovery links are redundant; portable wrappers below replace them.
                if relative.as_posix() in ('.agents/skills', '.claude/skills'):
                    continue
                raise ValueError(f'Unexpected archive symlink: {relative}')
            if relative.as_posix().casefold() in seen:
                raise ValueError(f'Case-colliding archive entry: {relative}')
            seen.add(relative.as_posix().casefold())
            files[relative.as_posix()] = archive.read(entry)
    return files


def plan():
    writes = {}
    names = set()
    for source in json.loads((BASE / 'sources.json').read_text(encoding='utf-8')):
        destination = BASE / '.installed' / (source['name'] + '-' + source['commit'])
        files = archive_files(source)
        for relative, data in files.items():
            writes[destination / relative] = data
        skill_paths = [p for p in files if p == 'skill/SKILL.md' or re.fullmatch(r'skills/[^/]+/SKILL.md', p)]
        for relative in skill_paths:
            text = files[relative].decode('utf-8')
            header = re.match(r'\A---\r?\n(.*?)\r?\n---', text, re.S)
            if not header:
                raise ValueError(f'Missing skill metadata: {relative}')
            name = re.search(r'^name:\s*([a-z0-9-]+)\s*$', header[1], re.M)
            if not name or name[1] in names:
                raise ValueError(f'Missing or duplicate skill name: {relative}')
            name = name[1]
            names.add(name)
            target = (destination / relative).as_posix()
            wrapper = (header[0] + '\n\n'
                '# Bundled team skill\n\n'
                f'Read the full upstream skill at `{target}` before doing this task.\n'
                'Resolve its reference paths relative to that original file, not this wrapper.\n'
                'The repository AGENTS.md and user instructions still apply. Use Cardano preprod\n'
                'for this hackathon; upstream examples do not authorize transfers, publishing,\n'
                'resource creation, or posting feedback. Never expose credentials.\n')
            for host in ('.agents', '.claude'):
                writes[PROJECT / host / 'skills' / name / 'SKILL.md'] = wrapper.encode('utf-8')
    return writes, names


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify files and discovery wrappers without writing')
    args = parser.parse_args()
    writes, names = plan()
    missing = []
    # Preflight every destination before writing. Never overwrite an existing skill or symlink.
    for path, data in writes.items():
        if not path.resolve().is_relative_to(PROJECT):
            raise ValueError(f'Destination leaves project: {path}')
        parent = path
        while parent != PROJECT:
            if parent.is_symlink() or (hasattr(os.path, 'isjunction') and os.path.isjunction(parent)):
                raise ValueError(f'Existing link at destination: {parent}')
            parent = parent.parent
        if path.exists():
            if not path.is_file() or path.read_bytes() != data:
                raise ValueError(f'Existing file differs; preserve it and resolve manually: {path}')
        else:
            missing.append((path, data))
    if args.check and missing:
        raise ValueError(f'{len(missing)} files missing. Run python team-skills/install.py first.')
    if not args.check:
        for path, data in missing:
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open('xb') as stream:
                stream.write(data)
    print(f"{'Verified' if args.check else 'Installed'} {len(names)} skills for Codex and Claude Code.")
    print('Full upstream skill files and reference corpus: team-skills/.installed/')
    print('Open a new agent session and verify the skill list; other agents can read the files directly.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error)) from None

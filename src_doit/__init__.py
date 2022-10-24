from pathlib import Path
import subprocess

from hat.doit import common
from hat.doit.docs import build_sphinx
from hat.doit.js import (build_npm,
                         ESLintConf,
                         run_eslint)


__all__ = ['task_clean_all',
           'task_node_modules',
           'task_build',
           'task_build_js',
           'task_build_ts',
           'task_test',
           'task_check',
           'task_docs']


build_dir = Path('build')
docs_dir = Path('docs')
src_js_dir = Path('src_js')
jest_dir = Path('test_jest')

build_js_dir = build_dir / 'js'
build_ts_dir = build_dir / 'ts'
build_docs_dir = build_dir / 'docs'


def task_clean_all():
    """Clean all"""
    return {'actions': [(common.rm_rf, [build_dir])]}


def task_node_modules():
    """Install node_modules"""
    return {'actions': ['yarn install --silent']}


def task_build():
    """Build"""
    return {'actions': None,
            'task_dep': ['build_js']}


def task_build_js():
    """Build JavaScript npm"""

    def build():
        build_npm(
            src_dir=build_ts_dir,
            dst_dir=build_js_dir,
            name='@hat-open/renderer',
            description='Hat virtual DOM renderer',
            license=common.License.APACHE2,
            homepage='https://github.com/hat-open/hat-renderer',
            repository='hat-open/hat-renderer')

    return {'actions': [build],
            'task_dep': ['build_ts',
                         'node_modules']}


def task_build_ts():
    """Build TypeScript"""

    def build():
        subprocess.run(['node_modules/.bin/tsc'],
                       check=True)

    return {'actions': [build],
            'task_dep': ['node_modules']}


def task_test():
    """Test"""

    def run(args):
        subprocess.run(['node_modules/.bin/jest', *(args or [])],
                       check=True)

    return {'actions': [run],
            'pos_arg': 'args',
            'task_dep': ['node_modules']}


def task_check():
    """Check with eslint"""
    return {'actions': [(run_eslint, [src_js_dir, ESLintConf.TS]),
                        (run_eslint, [jest_dir, ESLintConf.TS])],
            'task_dep': ['node_modules']}


def task_docs():
    """Docs"""

    def build():
        build_sphinx(src_dir=docs_dir,
                     dst_dir=build_docs_dir,
                     project='hat-renderer')

    return {'actions': [build],
            'task_dep': ['node_modules']}

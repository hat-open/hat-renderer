from pathlib import Path

from hat.doit import common
from hat.doit.docs import build_sphinx
from hat.doit.js import (build_npm,
                         run_eslint)


__all__ = ['task_clean_all',
           'task_node_modules',
           'task_build',
           'task_check',
           'task_docs']


build_dir = Path('build')
docs_dir = Path('docs')
src_js_dir = Path('src_js')

build_js_dir = build_dir / 'js'
build_docs_dir = build_dir / 'docs'


def task_clean_all():
    """Clean all"""
    return {'actions': [(common.rm_rf, [build_dir])]}


def task_node_modules():
    """Install node_modules"""
    return {'actions': ['yarn install --silent']}


def task_build():
    """Build"""

    def build():
        build_npm(
            src_dir=src_js_dir,
            dst_dir=build_js_dir,
            name='@hat-open/renderer',
            description='Hat virtual DOM renderer',
            license=common.License.APACHE2,
            homepage='https://github.com/hat-open/hat-renderer',
            repository='hat-open/hat-renderer')

    return {'actions': [build],
            'task_dep': ['node_modules']}


def task_check():
    """Check with eslint"""
    return {'actions': [(run_eslint, [src_js_dir])],
            'task_dep': ['node_modules']}


def task_docs():
    """Docs"""

    def build():
        build_sphinx(src_dir=docs_dir,
                     dst_dir=build_docs_dir,
                     project='hat-renderer')

    return {'actions': [build],
            'task_dep': ['node_modules']}

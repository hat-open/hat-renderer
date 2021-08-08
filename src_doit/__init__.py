from pathlib import Path
import subprocess

from hat import json
from hat.doit import common


__all__ = ['task_clean_all',
           'task_build',
           'task_check',
           'task_docs',
           'task_deps']


build_dir = Path('build')
docs_dir = Path('docs')
src_js_dir = Path('src_js')
node_modules_dir = Path('node_modules')

build_js_dir = build_dir / 'js'
build_docs_dir = build_dir / 'docs'

readme_path = Path('README.rst')


def task_clean_all():
    """Clean all"""
    return {'actions': [(common.rm_rf, [build_dir])]}


def task_build():
    """Build"""

    def mappings():
        yield (src_js_dir / '@hat-open/renderer.js',
               build_js_dir / '@hat-open/renderer/index.js')

    def build():
        common.rm_rf(build_js_dir)
        common.mkdir_p(build_js_dir)

        dst_readme_path = build_js_dir / readme_path.with_suffix('.md').name
        subprocess.run(['pandoc', str(readme_path),
                        '-o', str(dst_readme_path)],
                       check=True)

        for src_path, dst_path in mappings():
            common.mkdir_p(dst_path.parent)
            common.cp_r(src_path, dst_path)

        (build_js_dir / 'package.json').write_text(json.encode({
            'name': '@hat-open/renderer',
            'version': common.get_version(common.VersionType.SEMVER),
            'description': 'Hat virtual DOM renderer',
            'homepage': 'https://github.com/hat-open/hat-renderer',
            'bugs': 'https://github.com/hat-open/hat-renderer/issues',
            'license': common.License.APACHE2.value,
            'main': 'index.js',
            'repository': 'hat-open/hat-renderer',
            'dependencies': {'snabbdom': '*',
                             '@hat-open/util': '*'}
        }, indent=4))

        subprocess.run(['npm', 'pack', '--silent'],
                       stdout=subprocess.DEVNULL,
                       cwd=str(build_js_dir),
                       check=True)

    return {'actions': [build],
            'task_dep': ['deps']}


def task_check():
    """Check with eslint"""
    eslint_path = node_modules_dir / '.bin/eslint'
    return {'actions': [f'{eslint_path} {src_js_dir}'],
            'task_dep': ['deps']}


def task_deps():
    """Install dependencies"""
    return {'actions': ['yarn install --silent']}


def task_docs():
    """Docs - build documentation"""

    def build():
        common.sphinx_build(common.SphinxOutputType.HTML, docs_dir,
                            build_docs_dir)

        # with tempfile.TemporaryDirectory() as tmpdir:
        #     tmpdir = Path(tmpdir)
        #     conf_path = tmpdir / 'jsdoc.json'
        #     conf_path.write_text(json.encode({
        #         "source": {
        #             "include": str(src_js_dir)
        #         },
        #         "plugins": [
        #             "plugins/markdown"
        #         ],
        #         "opts": {
        #             "template": "node_modules/docdash",
        #             "destination": str(build_docs_dir / 'js_api'),
        #             "recurse": True
        #         },
        #         "templates": {
        #             "cleverLinks": True
        #         }
        #     }))
        #     js_doc_path = Path('node_modules/.bin/jsdoc')
        #     subprocess.run([str(js_doc_path), '-c', str(conf_path)],
        #                    check=True)

    return {'actions': [build],
            'task_dep': ['deps']}

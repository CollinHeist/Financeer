from io import StringIO
from pathlib import Path
from sys import exit as sys_exit

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from rich.console import Console
from rich.traceback import Traceback

from app.db.deps import get_database
from app.core.config import settings
from app.db.base import engine
from app.db.test import initialize_test_data
from app.utils.logging import log


APP_DIRECTORY = Path(__file__).parent.parent
CONFIG_DIRECTORY = APP_DIRECTORY.parent.parent / 'config'
CONFIG_DIRECTORY.mkdir(parents=True, exist_ok=True)


def perform_db_migrations() -> None:
    """Perform any necessar database migrations."""

    # Initialize Alembic config (simulating config.ini)
    alembic_config = Config()
    alembic_config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)
    alembic_config.set_main_option(
        'script_location', str(APP_DIRECTORY / 'alembic')
    )

    # Backup database if migration is about to be performed
    backup = None
    script = ScriptDirectory.from_config(alembic_config)
    with engine.begin() as connection:
        context = MigrationContext.configure(connection)
        if ((current := context.get_current_revision())
            != (latest := script.get_current_head())):
            log.info('Pending schema migration - performing database backup')
            log.debug(f'{current} -> {latest}')
            # backup = backup_data(preferences.current_version, log=log)

    # Perform database migrations
    try:
        command.upgrade(alembic_config, 'head')
    except Exception:
        console = Console(file=StringIO())
        console.print(Traceback(
            show_locals=True,
            locals_max_length=512,
            locals_max_string=512,
            extra_lines=2,
            indent_guides=False,
        ))
        log.error(f'SQL Migration Error:\n{console.file.getvalue()}')
        log.critical('Unable to migrate and initialize Database')
        if backup:
            log.info('Restoring from backup..')
            # restore_backup(backup, log=log)
        sys_exit(1)

    # Perform database seeding
    if current is None:
        with next(get_database()) as db:
            initialize_test_data(db)

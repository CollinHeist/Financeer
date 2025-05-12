import sys

from loguru import logger as log


handlers = [
    # WARNING: The sys.stdout print WILL NOT have secrets redacted
    dict(
        sink=sys.stdout,
        level='TRACE',
        format='<level>[<bold>{level}</bold>] {message}</level>',
        colorize=True,
        backtrace=True,
        diagnose=True,
        enqueue=True,
    ),
]
levels = [
    dict(name='TRACE', color='<dim><fg #6d6d6d>'),
    dict(name='DEBUG', color='<dim><white>'),
    dict(name='INFO', color='<light-cyan>'),
    dict(name='WARNING', color='<yellow>'),
    dict(name='ERROR', color='<fg 237,112,46>'),
    dict(name='CRITICAL', color='<red><bold>'),
]

log.configure(handlers=handlers, levels=levels) # type: ignore

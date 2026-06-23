import core


def test_package_version():
    assert isinstance(core.__version__, str)
